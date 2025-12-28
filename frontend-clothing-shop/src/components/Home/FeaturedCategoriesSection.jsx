import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../Product/ProductCard';

/**
 * Component hiển thị các categories được featured từ CMS
 * Mỗi category sẽ show một số products của category đó
 */
const FeaturedCategoriesSection = ({ featuredCategories, loading }) => {
  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!featuredCategories?.length) {
    return null;
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Danh Mục Nổi Bật
        </h2>

        {featuredCategories.map((categoryData, index) => (
          <div key={categoryData.category.id} className="mb-16">
            {/* Category Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  {categoryData.category.name}
                </h3>
                <p className="text-gray-600 mt-1">
                  Khám phá bộ sưu tập {categoryData.category.name.toLowerCase()}
                </p>
              </div>
              
              <Link
                to={`/shop/category/${categoryData.category.slug}`}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 group"
              >
                Xem tất cả
                <svg 
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categoryData.products.map((product) => (
                <ProductCard 
                  key={product._id || product.id} 
                  product={product}
                />
              ))}
            </div>

            {/* Divider */}
            {index < featuredCategories.length - 1 && (
              <div className="mt-16 border-b border-gray-200"></div>
            )}
          </div>
        ))}

        {/* Call to action */}
        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Khám Phá Tất Cả Sản Phẩm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCategoriesSection;