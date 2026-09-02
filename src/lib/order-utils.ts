import { Order, Product, ProductVariant, SupplierSummaryItem } from './types';

export function isPreorderProduct(product: Product, variantId?: string): boolean {
  if (product.variants && product.variants.length > 0 && variantId) {
    const variant = product.variants.find((v: ProductVariant) => v.id === variantId);
    if (variant) {
      const variantStock = variant.stock ?? variant.inventory ?? 0;
      return variantStock <= 0;
    }
  }
  return (product.stock ?? product.inventory ?? 0) <= 0;
}
