import { useState, useEffect } from 'react';
import cmsService from '../services/cmsService';

// Hook để lấy Home Configuration
export const useHomeConfig = () => {
  const [homeConfig, setHomeConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeConfig = async () => {
      try {
        setLoading(true);
        const config = await cmsService.getHomeConfiguration();
        setHomeConfig(config);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeConfig();
  }, []);

  return { homeConfig, loading, error, refetch: () => fetchHomeConfig() };
};

// Hook để lấy Settings
export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await cmsService.getSettings();
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};

// Hook để lấy CMS Blogs (khác với backend blogs)
export const useCMSBlogs = (page = 1, pageSize = 10) => {
  const [blogs, setBlogs] = useState([]);
  const [meta, setMeta] = useState({ pagination: { page: 1, pageCount: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const result = await cmsService.getBlogs(page, pageSize);
        setBlogs(result.data);
        setMeta(result.meta);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [page, pageSize]);

  return { blogs, meta, loading, error };
};

// Hook để lấy Blog Categories
export const useCMSBlogCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await cmsService.getBlogCategories();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Hook để lấy Product Categories (dùng cho home page)
export const useCMSProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await cmsService.getProductCategories();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

// Hook để lấy Coupons
export const useCMSCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const data = await cmsService.getCoupons();
        setCoupons(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  return { coupons, loading, error };
};