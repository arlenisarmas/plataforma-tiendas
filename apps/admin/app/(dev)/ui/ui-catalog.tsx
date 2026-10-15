'use client';

import { useState } from 'react';
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
} from '@plataforma/ui';

export function UiCatalog() {
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState('Tu tienda está lista para empezar.');
  return (
    <main
      className="ui-root"
      style={{ maxWidth: 960, margin: 'auto', padding: 16, display: 'grid', gap: 24 }}
    >
      <PageHeader
        title="Elementos de tu tienda"
        description="Ejemplos para revisar cómo se ve y se usa cada elemento."
      />
      <Card aria-label="Botones">
        <h2>Botones</h2>
        <div className="ui-actions">
          <Button onClick={() => setNotice('Guardado. Podés seguir editando.')}>Guardar</Button>
          <Button variant="secondary">Volver</Button>
          <Button variant="danger">Borrar</Button>
          <Button loading>Guardar</Button>
        </div>
      </Card>
      <Card aria-label="Campos">
        <h2>Campos</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Nombre del producto" help="Por ejemplo, Mesa ratona">
            <Input placeholder="Mesa ratona" />
          </Field>
          <Field label="Descripción" error="Agregá una descripción para seguir.">
            <Textarea rows={3} />
          </Field>
          <Field label="País">
            <Select defaultValue="ar">
              <option value="ar">Argentina</option>
              <option value="cl">Chile</option>
            </Select>
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            Mostrar en la tienda <Switch checked={enabled} onCheckedChange={setEnabled} />
          </label>
        </div>
      </Card>
      <Card aria-label="Estados">
        <h2>Estados</h2>
        <div className="ui-actions">
          <Badge status="success">Listo</Badge>
          <Badge status="warning">Sin publicar</Badge>
          <Badge status="danger">Necesita atención</Badge>
        </div>
        <div style={{ height: 44, maxWidth: 240, marginTop: 16 }}>
          <Skeleton style={{ height: '100%' }} />
        </div>
      </Card>
      <EmptyState
        title="Todavía no hay productos"
        description="Agregá el primero para empezar a vender."
        action={<Button>Agregar producto</Button>}
      />
      <Card aria-label="Mensajes y ayuda">
        <h2>Mensajes y ayuda</h2>
        <Toast
          message={notice}
          action={
            <Button variant="secondary" onClick={() => setNotice('Cambio deshecho.')}>
              Deshacer
            </Button>
          }
        />
        <HelpTip text="Podés cambiar esto después." />
      </Card>
      <Card aria-label="Confirmación">
        <h2>Confirmación</h2>
        <ConfirmDialog
          trigger={<Button variant="danger">Borrar producto</Button>}
          title="¿Borramos este producto?"
          description="Esta acción no se puede deshacer."
          confirmText="Sí, borrar el producto"
          onConfirm={() => setNotice('Producto borrado.')}
          danger
        />
      </Card>
      <Card aria-label="Asistente">
        <StepWizard
          steps={[
            {
              title: 'Nombre',
              fields: [
                <Field key="name" label="Nombre de la tienda">
                  <Input />
                </Field>,
              ],
            },
            {
              title: 'País',
              fields: [
                <Field key="country" label="País">
                  <Select>
                    <option>Argentina</option>
                    <option>Chile</option>
                  </Select>
                </Field>,
              ],
            },
          ]}
          onComplete={() => setNotice('¡Listo! Tu tienda ya tiene nombre y país.')}
        />
      </Card>
    </main>
  );
}
