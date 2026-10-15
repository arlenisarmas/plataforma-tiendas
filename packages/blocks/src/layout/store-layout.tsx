import type { ReactNode } from 'react';
import type { Theme } from '../theme';
import { themeToCssVars } from '../theme';

type LayoutProps = {
  theme: Theme;
  storeName: string;
  homeHref: string;
  children: ReactNode;
  search?: ReactNode;
  social?: ReactNode;
  paymentIcons?: ReactNode;
};

export function StoreLayout({ theme, storeName, homeHref, children, search, social, paymentIcons }: LayoutProps) {
  return (
    <div className="store-layout" style={themeToCssVars(theme) as React.CSSProperties}>
      <header className={`store-header store-header--${theme.header.layout}`}>
        <a href={homeHref}>{storeName}</a>
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
