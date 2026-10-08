import type { ReactNode } from "react";

interface Paso {
  texto: ReactNode;
}

const IPHONE: Paso[] = [
  { texto: <>Abrí <strong>dollartracker.vercel.app</strong> en Safari.</> },
  { texto: <>Tocá el botón <strong>Compartir</strong> (el cuadrado con una flecha hacia arriba).</> },
  { texto: <>Elegí <strong>Agregar a pantalla de inicio</strong>.</> },
  { texto: <>Confirmá con <strong>Agregar</strong>. Listo: aparece el ícono en tu pantalla.</> },
];

const ANDROID: Paso[] = [
  { texto: <>Abrí el sitio en Chrome.</> },
  { texto: <>Tocá los <strong>tres puntos</strong> del menú, arriba a la derecha.</> },
  { texto: <>Elegí <strong>Instalar aplicación</strong> (o <strong>Agregar a pantalla principal</strong>).</> },
];

const PC: Paso[] = [
  { texto: <>En Chrome o Edge, tocá el ícono de <strong>instalar</strong> en la barra de direcciones.</> },
  { texto: <>También podés ir al menú y elegir <strong>Instalar DollarTracker</strong>.</> },
];

function Lista({ pasos }: { pasos: Paso[] }) {
  return (
    <ol className="instalar__pasos">
      {pasos.map((p, i) => (
        <li key={i}>{p.texto}</li>
      ))}
    </ol>
  );
}

// Sección discreta al final de la página: cómo dejar la app en la pantalla de
// inicio como si fuera una aplicación. Va cerrada por defecto para no sumar ruido.
export default function InstalarApp() {
  return (
    <details className="instalar">
      <summary className="instalar__resumen">Instalar la app</summary>
      <div className="instalar__cuerpo">
        <p className="instalar__intro">
          Se usa como una aplicación, sin abrir el navegador, y con las cotizaciones a un toque.
        </p>

        <section className="instalar__plataforma">
          <h3>iPhone</h3>
          <Lista pasos={IPHONE} />
        </section>

        <section className="instalar__plataforma">
          <h3>Android</h3>
          <Lista pasos={ANDROID} />
        </section>

        <section className="instalar__plataforma">
          <h3>Computadora</h3>
          <Lista pasos={PC} />
        </section>
      </div>
    </details>
  );
}
