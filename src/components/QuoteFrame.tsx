import { useState } from "react";

type Props = {
  title: string;
  src: string;
  refreshKey: number;
};

export default function QuoteFrame({ title, src, refreshKey }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <section className="quoteCard">
      <header className="quoteHeader">
        <h2 className="quoteTitle">{title}</h2>
      </header>

      <div className={`quoteBody ${loaded ? "isLoaded" : ""}`}>
        <iframe
          key={refreshKey}
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
          scrolling="no"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </section>
  );
}
