type Props = {
  title: string;
  src: string;
};

export default function QuoteFrame({ title, src }: Props) {
  return (
    <section className="quoteCard">
      <header className="quoteHeader">
        <h2 className="quoteTitle">{title}</h2>
      </header>

      <div className="quoteBody">
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
  );
}
