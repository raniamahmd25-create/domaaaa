import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  lastConnected?: string | null;
}

const STORAGE_KEY = 'qalami_supabase_config';

class SupabaseServiceClass {
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    lastConnected: null,
  };
  private client: SupabaseClient | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          url: parsed.url || '',
          anonKey: parsed.anonKey || '',
          lastConnected: parsed.lastConnected || null,
        };
        if (this.config.url && this.config.anonKey) {
          this.client = createClient(this.config.url, this.config.anonKey);
        }
      }
    } catch (e) {
      console.warn('Failed to load Supabase config:', e);
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.url && this.config.anonKey);
  }

  public getClient(): SupabaseClient | null {
    if (!this.client && this.isConfigured()) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey);
      } catch (e) {
        console.warn('Failed to initialize Supabase client:', e);
      }
    }
    return this.client;
  }

  public async saveConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl) {
      return { success: false, message: 'يرجى إدخال رابط مشروع Supabase (Project URL)' };
    }
    if (!trimmedKey) {
      return { success: false, message: 'يرجى إدخال مفتاح الـ API Key الخاص بـ Supabase' };
    }

    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, message: 'صيغة رابط المشروع غير صحيحة، يجب أن يبدأ بـ https://' };
    }

    // Test connection before saving
    const testResult = await this.testConnection(trimmedUrl, trimmedKey);
    if (!testResult.success) {
      return testResult;
    }

    this.config = {
      url: trimmedUrl,
      anonKey: trimmedKey,
      lastConnected: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      this.client = createClient(trimmedUrl, trimmedKey);
      this.notify();
      return { success: true, message: 'تم حفظ إعدادات Supabase والاتصال بها بنجاح! ⚡' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'تعذر حفظ الإعدادات محلياً' };
    }
  }

  public async testConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      return { success: false, message: 'يرجى ملء رابط المشروع ومفتاح API Key أولاً' };
    }

    try {
      // Check the REST root endpoint of the Supabase project
      const response = await fetch(`${trimmedUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: trimmedKey,
          Authorization: `Bearer ${trimmedKey}`,
        },
      });

      // Status 200 or 404 (schema root) or 401 (invalid key)
      if (response.status === 200 || response.status === 404) {
        return { success: true, message: 'تم الاتصال بمشروع Supabase بنجاح! المفتاح والرابط صالحان ✅' };
      } else if (response.status === 401 || response.status === 403) {
        return { success: false, message: 'مفتاح الـ API Key غير صالح أو لا يملك صلاحيات للوصول ❌' };
      } else {
        return { success: true, message: `استجاب خادم Supabase بنجاح (رمز الحالة: ${response.status})` };
      }
    } catch (err: any) {
      return {
        success: false,
        message: 'تعذر الوصول إلى رابط المشروع. تأكد من صحة الرابط والاتصال بالإنترنت.',
      };
    }
  }

  public async syncDocument(doc: any): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const payload = {
        id: doc.id,
        title: doc.title,
        subject: doc.subject,
        custom_subject_name: doc.customSubjectName || null,
        doc_type: doc.docType,
        format: doc.format,
        grade: doc.grade,
        term: doc.term,
        author: doc.author,
        description: doc.description || '',
        tags: doc.tags || [],
        pages: doc.pages || [],
        user_id: doc.userId || 'guest_user',
        updated_at: new Date().toISOString(),
      };

      const { error } = await client.from('study_documents').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase study_documents sync warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase sync error:', e);
      return false;
    }
  }

  public async deleteDocument(docId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const { error } = await client.from('study_documents').delete().eq('id', docId);
      if (error) {
        console.warn('Supabase delete document warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase delete error:', e);
      return false;
    }
  }

  public async fetchDocuments(): Promise<any[] | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('study_documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error || !data) {
        return null;
      }

      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        customSubjectName: item.custom_subject_name,
        docType: item.doc_type,
        format: item.format,
        grade: item.grade,
        term: item.term,
        author: item.author,
        description: item.description,
        tags: item.tags,
        pages: item.pages || [],
        userId: item.user_id,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Supabase fetch error:', e);
      return null;
    }
  }

  public async syncVideo(video: any): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const { error } = await client.from('videos').upsert({
        id: video.id,
        title: video.title,
        description: video.description || '',
        video_url: video.videoUrl,
        thumbnail_url: video.thumbnailUrl || '',
        duration_seconds: video.durationSeconds,
        type: video.type,
        subject: video.subject,
        grade: video.grade,
        author: video.author,
        likes_count: video.likesCount || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      return !error;
    } catch {
      return false;
    }
  }

  public clearConfig() {
    this.config = {
      url: '',
      anonKey: '',
      lastConnected: null,
    };
    this.client = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const SupabaseService = new SupabaseServiceClass();
