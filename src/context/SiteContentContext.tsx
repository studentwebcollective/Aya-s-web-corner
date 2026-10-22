import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteData, PortfolioWebsite, FormInquiry, defaultSiteData } from '../data/siteContent';

interface SiteContentContextType {
  data: SiteData;
  updateData: (fields: Partial<SiteData>) => void;
  updateNested: (path: string, value: any) => void;
  updateLogo: (img: string) => void;
  updateLogoScale: (scale: number) => void;
  addWebsite: (site: Omit<PortfolioWebsite, 'id'>) => void;
  deleteWebsite: (id: string) => void;
  addInquiry: (inq: Omit<FormInquiry, 'id' | 'createdAt' | 'status'>) => void;
  deleteInquiry: (id: string) => void;
  toggleInquiryStatus: (id: string) => void;
  resetToDefault: () => void;
  isSaved: boolean;
}

const STORAGE_KEY = 'ayas_clean_site_v4';

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SiteData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If priceAmount was cleared during the previous turn, restore €79
        if (parsed.home && !parsed.home.priceAmount) {
          parsed.home.priceAmount = defaultSiteData.home.priceAmount;
        }
        if (parsed.home && parsed.home.extraNote && parsed.home.extraNote.includes('Vaste lage prijs')) {
          parsed.home.extraNote = defaultSiteData.home.extraNote;
        }
        if (parsed.contact && parsed.contact.text && !parsed.contact.text.includes('€79')) {
          parsed.contact.text = defaultSiteData.contact.text;
        }

        // Ensure Aya's Web Corner is present in websites array
        if (Array.isArray(parsed.websites)) {
          const hasAya = parsed.websites.some(
            (w: any) => w.id === 'ayas-web-corner' || (w.title && w.title.toLowerCase().includes("aya"))
          );
          if (!hasAya) {
            parsed.websites = [defaultSiteData.websites[0], ...parsed.websites];
          }
          // Ensure websites have links populated
          parsed.websites = parsed.websites.map((w: any) => {
            const defaultMatch = defaultSiteData.websites.find((d) => d.id === w.id);
            return {
              ...w,
              link: w.link || defaultMatch?.link || 'https://instagram.com'
            };
          });
        }

        return { ...defaultSiteData, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load stored data', e);
    }
    return defaultSiteData;
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error(e);
    }
  }, [data]);

  const updateData = (fields: Partial<SiteData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const updateNested = (path: string, value: any) => {
    setData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current: any = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return clone;
    });
  };

  const updateLogo = (img: string) => {
    setData((prev) => ({ ...prev, logoImage: img }));
  };

  const updateLogoScale = (scale: number) => {
    setData((prev) => ({ ...prev, logoScale: scale }));
  };

  const addWebsite = (site: Omit<PortfolioWebsite, 'id'>) => {
    const newItem: PortfolioWebsite = {
      ...site,
      id: `website-${Date.now()}`
    };
    setData((prev) => ({
      ...prev,
      websites: [newItem, ...prev.websites]
    }));
  };

  const deleteWebsite = (id: string) => {
    setData((prev) => ({
      ...prev,
      websites: prev.websites.filter((w) => w.id !== id)
    }));
  };

  const addInquiry = (inq: Omit<FormInquiry, 'id' | 'createdAt' | 'status'>) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newInquiry: FormInquiry = {
      ...inq,
      id: `inq-${Date.now()}`,
      createdAt: dateStr,
      status: 'nieuw'
    };

    setData((prev) => ({
      ...prev,
      inquiries: [newInquiry, ...(prev.inquiries || [])]
    }));
  };

  const deleteInquiry = (id: string) => {
    setData((prev) => ({
      ...prev,
      inquiries: (prev.inquiries || []).filter((item) => item.id !== id)
    }));
  };

  const toggleInquiryStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      inquiries: (prev.inquiries || []).map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'nieuw' ? 'behandeld' : 'nieuw' }
          : item
      )
    }));
  };

  const resetToDefault = () => {
    setData(defaultSiteData);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        data,
        updateData,
        updateNested,
        updateLogo,
        updateLogoScale,
        addWebsite,
        deleteWebsite,
        addInquiry,
        deleteInquiry,
        toggleInquiryStatus,
        resetToDefault,
        isSaved
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
};
