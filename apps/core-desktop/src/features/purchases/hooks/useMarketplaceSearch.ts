// [PHASE: marketplace-preview — Marketplace search]
import * as React from 'react';
import { Supplier, CatalogProduct } from '@40labs/types';
import { templateCatalogRepo, templateSupplierRepo } from '../data/templateRepos';

export type SearchFilterType = 'all' | 'products' | 'suppliers' | 'followed';

export interface UseMarketplaceSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  filter: SearchFilterType;
  setFilter: (f: SearchFilterType) => void;
  suppliers: Supplier[];
  products: (CatalogProduct & { supplierName?: string })[];
  followedSuppliers: Supplier[];
  recommendedSuppliers: Supplier[];
  isLoading: boolean;
  isOnline: boolean;
  lastSyncedAt: string;
  alternativesModalProduct: CatalogProduct | null;
  setAlternativesModalProduct: (p: CatalogProduct | null) => void;
  alternativesList: CatalogProduct[];
  isLoadingAlternatives: boolean;
  loadAlternatives: (product: CatalogProduct) => Promise<void>;
}

export function useMarketplaceSearch(): UseMarketplaceSearchReturn {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<SearchFilterType>('all');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [products, setProducts] = React.useState<(CatalogProduct & { supplierName?: string })[]>([]);
  const [followedSuppliers, setFollowedSuppliers] = React.useState<Supplier[]>([]);
  const [recommendedSuppliers, setRecommendedSuppliers] = React.useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOnline] = React.useState(navigator.onLine);
  const [lastSyncedAt] = React.useState(new Date().toISOString());

  const [alternativesModalProduct, setAlternativesModalProduct] = React.useState<CatalogProduct | null>(null);
  const [alternativesList, setAlternativesList] = React.useState<CatalogProduct[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = React.useState(false);

  // Debounce 120ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 120);
    return () => clearTimeout(timer);
  }, [query]);

  // Load initial empty query data (Followed + Recommended)
  React.useEffect(() => {
    let isMounted = true;
    async function loadDefaults() {
      const allSuppliers = await templateSupplierRepo.list();
      const followed = await templateSupplierRepo.listFollowed();
      const recommended = allSuppliers.filter(
        (s) => s.verification.verified40Labs && !followed.some((f) => f.businessId === s.businessId)
      );
      if (isMounted) {
        setFollowedSuppliers(followed);
        setRecommendedSuppliers(recommended);
      }
    }
    loadDefaults();
  }, []);

  // Search effect
  React.useEffect(() => {
    let isMounted = true;
    async function executeSearch() {
      setIsLoading(true);
      try {
        const trimmed = debouncedQuery.trim().toLowerCase();
        const allSuppliers = await templateSupplierRepo.list();
        const followed = await templateSupplierRepo.listFollowed();

        if (!trimmed) {
          if (isMounted) {
            setSuppliers(filter === 'followed' ? followed : allSuppliers);
            setProducts([]);
            setIsLoading(false);
          }
          return;
        }

        let matchedSuppliers: Supplier[] = [];
        if (filter === 'all' || filter === 'suppliers' || filter === 'followed') {
          matchedSuppliers = allSuppliers.filter((s) => {
            if (filter === 'followed' && !followed.some((f) => f.businessId === s.businessId)) return false;
            return (
              s.name.toLowerCase().includes(trimmed) ||
              s.location.city.toLowerCase().includes(trimmed) ||
              s.location.region.toLowerCase().includes(trimmed) ||
              s.businessId.toLowerCase().includes(trimmed)
            );
          });
        }

        let matchedProducts: (CatalogProduct & { supplierName?: string })[] = [];
        if (filter === 'all' || filter === 'products') {
          const prods = await templateCatalogRepo.searchProducts(trimmed);
          matchedProducts = prods.map((p) => {
            const sup = allSuppliers.find((s) => s.businessId === p.supplierBusinessId);
            return {
              ...p,
              supplierName: sup?.name || p.supplierBusinessId,
            };
          });
        }

        if (isMounted) {
          setSuppliers(matchedSuppliers);
          setProducts(matchedProducts);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    executeSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, filter]);

  const loadAlternatives = async (product: CatalogProduct) => {
    setAlternativesModalProduct(product);
    setIsLoadingAlternatives(true);
    try {
      const alts = await templateCatalogRepo.findAlternatives(product.medicineKey, product.supplierBusinessId);
      setAlternativesList(alts);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  return {
    query,
    setQuery,
    filter,
    setFilter,
    suppliers,
    products,
    followedSuppliers,
    recommendedSuppliers,
    isLoading,
    isOnline,
    lastSyncedAt,
    alternativesModalProduct,
    setAlternativesModalProduct,
    alternativesList,
    isLoadingAlternatives,
    loadAlternatives,
  };
}
