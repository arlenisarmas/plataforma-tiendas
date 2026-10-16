import { formatMoney } from '@plataforma/core';
import type { StoreContext } from '../types';
import type { CategoryData, ProductCardData } from './data';

function ProductCard({ item, ctx, outOfStockLabel }: { item: ProductCardData; ctx: StoreContext; outOfStockLabel: string }) {
  const locale = ctx.locale;
  const price = item.variant?.price_amount;
  const available = item.variant?.is_available ?? false;
  const imageUrl = item.image && ctx.assetUrl(item.image.asset_id);
  return <article className="block-product-card">
    <a href={`/producto/${item.slug}`}>
      {imageUrl && <img src={imageUrl} alt={item.image?.alt_text ?? item.name} loading="lazy" decoding="async" />}
      <h3>{item.name}</h3>
    </a>
    {price !== undefined && <p>{formatMoney({ amount: BigInt(price), currency: item.currency }, locale)}</p>}
    {item.variant?.compare_at_amount != null && item.variant.compare_at_amount > (price ?? 0) &&
      <s>{formatMoney({ amount: BigInt(item.variant.compare_at_amount), currency: item.currency }, locale)}</s>}
    {!available && <span className="block-product-card__out">{outOfStockLabel}</span>}
  </article>;
}

export function ProductCollection({ props, variant, data, ctx }: { props: { title: string }; variant: string; data: unknown; ctx: StoreContext }) {
  const loaded = data as { items: ProductCardData[]; outOfStockLabel: string } | null;
  return <section className={`block-product-collection block-product-collection--${variant}`} data-variant={variant}>
    {props.title && <h2>{props.title}</h2>}
    <div className="block-product-collection__items">{loaded?.items.map((item) => <ProductCard key={item.id} item={item} ctx={ctx} outOfStockLabel={loaded.outOfStockLabel} />)}</div>
  </section>;
}

export function CategoryGrid({ props, variant, data, ctx }: { props: { title: string }; variant: string; data: unknown; ctx: StoreContext }) {
  const items = data as CategoryData[] | null;
  return <section className={`block-category-grid block-category-grid--${variant}`} data-variant={variant}>
    {props.title && <h2>{props.title}</h2>}
    <div className="block-category-grid__items">{items?.map((item) => <a key={item.id} href={`/categoria/${item.slug}`}>
      {item.image_asset_id && ctx.assetUrl(item.image_asset_id) && <img src={ctx.assetUrl(item.image_asset_id)} alt="" loading="lazy" />}
      <span>{item.name}</span>
    </a>)}</div>
  </section>;
}
