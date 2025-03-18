import Balancer from "react-wrap-balancer";

export default function CashbackHow() {
  return (
    <section className="flex flex-col gap-12 mx-auto px-4 lg:px-16 container">
      <div className="self-center gap-8 grid max-w-5xl text-center">
        <h2 className="font-bold text-slate-900 text-3xl sm:text-4xl">
          <Balancer>Hoe werkt het?</Balancer>
        </h2>

        <div className="gap-4 grid grid-cols-1 lg:grid-cols-3">
          <Step
            number={1}
            title="Boek een curus"
            description="Boek een nieuwe NWD-cursus bij een van onze erkende vaarscholen."
          />
          <Step number={2} title="Doe stap 2" description="zo doe je stap 2" />
          <Step
            number={3}
            title="Ontvang €X,-"
            description="Na verificatie storten wij €X,- terug op je rekening binnen 30 dagen na de cursus"
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  description,
}: { number: number; title: string; description: string }) {
  return (
    <article className="flex flex-col items-center gap-2 px-4 py-12 border-2 border-branding-light rounded-xl">
      <span className="flex justify-center items-center bg-branding-orange mb-4 p-4 rounded-full size-15 aspect-square text-white text-2xl">
        {number}
      </span>
      <h3 className="font-bold text-branding-light text-2xl">{title}</h3>
      <p className="text-slate-600 text-sm">
        <Balancer>{description}</Balancer>
      </p>
    </article>
  );
}
