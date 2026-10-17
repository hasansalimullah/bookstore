import { HomeCarousel, HomePromos } from "./Rotating";
import { ContactBlock, LinkButtons, Stats } from "./Blocks";
import Newsletter from "./Newsletter";

export function Carousels({ only }: { only: number }) {
  return <HomeCarousel index={only} tight={only === 1} />;
}

export function ClosingBlocks() {
  return (
    <>
      <ContactBlock />
      <Stats />
      <Newsletter />
    </>
  );
}

export { HomePromos as Promos, LinkButtons };