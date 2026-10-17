import type { ReactNode } from 'react';
import type { Theme } from '../theme';
import { themeToCssVars } from '../theme';

type LayoutProps = {
  theme: Theme;
  storeName: string;
  /** Logo de la tienda (URL pública); si no hay, se muestra solo el nombre. */
  logoUrl?: string | undefined;
  homeHref: string;
  children: ReactNode;
  search?: ReactNode;
  social?: ReactNode;
  paymentIcons?: ReactNode;
};

export function StoreLayout({ theme, storeName, logoUrl, homeHref, children, search, social, paymentIcons }: LayoutProps) {
  return (
    <div className="store-layout" style={themeToCssVars(theme) as React.CSSProperties}>
      <header className={`store-header store-header--${theme.header.layout} store-header--${theme.header.style}`}>
        <a href={homeHref} className="store-header__brand">
          {logoUrl && <img src={logoUrl} alt="" className="store-header__logo" />}
          <span>{storeName}</span>
        </a>
        {theme.header.showSearch && search}
      </header>
      <main>{children}</main>
      <footer className="store-footer">
        {theme.footer.text && <p>{theme.footer.text}</p>}
        {theme.footer.showSocial && social}
        {theme.footer.showPaymentIcons && paymentIcons}
      </footer>
    </div>
  );
}
