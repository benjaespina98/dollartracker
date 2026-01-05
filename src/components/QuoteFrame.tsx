type Props = {
  title: string;
  src: string;
};

export default function QuoteFrame({ title, src }: Props) {
  const embedHTML = `<div><iframe style="width:320px;height:260px;border-radius:10px;box-shadow:2px 4px 4px rgb(0 0 0 / 25%);display:flex;justify-content:center;border:1px solid #bcbcbc" src="${src}" frameborder="0"></iframe></div>`;
  
  return (
    <section className="quoteCard">
      <header className="quoteHeader">
        <h2 className="quoteTitle">{title}</h2>
      </header>

      <div className="quoteBody" dangerouslySetInnerHTML={{ __html: embedHTML }} />
    </section>
  );
}
