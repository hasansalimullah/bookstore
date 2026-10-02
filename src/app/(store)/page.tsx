import { site } from "@/content/site";
import HeroSlider from "@/components/store/HeroSlider";
import { HeroDivider } from "@/components/store/Divider";
import { Carousels, ClosingBlocks, LinkButtons, Promos } from "@/components/store/LowerSections";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HeroSlider slides={site.hero} />
      <HeroDivider />
      <Carousels only={0} />
      <div style={{ height: 54 }} />
      <Promos />
      <div style={{ height: 56 }} />
      <Carousels only={1} />
      <div style={{ height: 78 }} />
      <LinkButtons />
      <div style={{ height: 57 }} />
      <ClosingBlocks />
    </>
  );
}
