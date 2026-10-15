// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactElement } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  HelpTip,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StepWizard,
  Switch,
  Textarea,
  Toast,
} from './index';

afterEach(cleanup);

async function expectAccessible(element: ReactElement) {
  const { container } = render(element);
  expect((await axe(container)).violations).toEqual([]);
}

describe('accessible components', () => {
  it('Button has primary, secondary, danger and loading states', async () => {
    await expectAccessible(
      <>
        <Button>Guardar</Button>
        <Button variant="secondary">Volver</Button>
        <Button variant="danger">Borrar</Button>
        <Button loading>Guardar</Button>
      </>,
    );
    expect((screen.getByRole('button', { name: 'Cargando…' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
  it('Field connects help and error to Input', async () => {
    await expectAccessible(
      <Field label="Nombre" help="Ejemplo" error="Escribí un nombre">
        <Input />
      </Field>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Nombre' }).getAttribute('aria-describedby'),
    ).toContain('error');
  });
  it('Textarea has a label', async () => {
    await expectAccessible(
      <Field label="Descripción">
        <Textarea />
      </Field>,
    );
  });
  it('Select has a label', async () => {
    await expectAccessible(
      <Field label="País">
        <Select>
          <option>Argentina</option>
        </Select>
      </Field>,
    );
  });
  it('Switch works by keyboard', async () => {
    await expectAccessible(
      <label>
        Mostrar <Switch />
      </label>,
    );
    const toggle = screen.getByRole('switch', { name: 'Mostrar' });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
  it('Card has an accessible section name', async () => {
    await expectAccessible(<Card aria-label="Productos">Contenido</Card>);
  });
  it('EmptyState contains a next action', async () => {
    await expectAccessible(
      <EmptyState
        title="Sin productos"
        description="Agregá el primero."
        action={<Button>Agregar producto</Button>}
      />,
    );
  });
  it('Skeleton is hidden from assistive technology', async () => {
    await expectAccessible(
      <div role="status" aria-label="Cargando productos">
        <Skeleton style={{ height: 44 }} />
      </div>,
    );
  });
  it('ConfirmDialog opens by keyboard and gives explicit confirmation', async () => {
    const onConfirm = vi.fn();
    await expectAccessible(
      <ConfirmDialog
        trigger={<Button>Borrar</Button>}
        title="¿Borrar?"
        description="No se puede deshacer."
        confirmText="Sí, borrar"
        onConfirm={onConfirm}
        danger
      />,
    );
    screen.getByRole('button', { name: 'Borrar' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((await axe(document.body)).violations).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
  it('Toast announces its message', async () => {
    await expectAccessible(<Toast message="Guardado" />);
    expect(screen.getByRole('status').textContent).toBe('Guardado');
  });
  it('HelpTip reveals contextual help by keyboard', async () => {
    await expectAccessible(<HelpTip text="Podés cambiarlo después." />);
    screen.getByRole('button', { name: 'Ayuda' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Podés cambiarlo después.').hidden).toBe(false);
  });
  it('StepWizard shows progress and limits fields', async () => {
    await expectAccessible(
      <StepWizard
        steps={[
          {
            title: 'Nombre',
            fields: [
              <Field key="a" label="Nombre">
                <Input />
              </Field>,
            ],
          },
          { title: 'País', fields: [] },
        ]}
        onComplete={() => undefined}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByText('Paso 2 de 2')).toBeTruthy();
    expect(() =>
      render(
        <StepWizard
          steps={[{ title: 'Demasiados', fields: [1, 2, 3, 4] }]}
          onComplete={() => undefined}
        />,
      ),
    ).toThrow();
  });
  it('PageHeader has a heading', async () => {
    await expectAccessible(<PageHeader title="Productos" description="Tu tienda" />);
  });
  it('Badge has visible status text', async () => {
    await expectAccessible(<Badge status="success">Listo</Badge>);
  });
});
