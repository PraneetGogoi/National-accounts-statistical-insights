import { useEffect, useState } from "react";
import { chapters } from "./chapters.config";
import { ChapterText } from "./ChapterText";
import { DynamicChart } from "./DynamicChart";
import { loadNASData, getGDPTrend, getSectoralGVA, getExpenditureComponents, getGrowthRates, getQuarterlyGDP, NASRecord } from "@/lib/data-utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export function InteractiveNarrative() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [data, setData] = useState<{
    gdpTrend: any[];
    growthRates: any[];
    sectoralGVA: any[];
    quarterlyGDP: any[];
    expenditure: any[];
  } | null>(null);

  useEffect(() => {
    loadNASData().then((d: NASRecord[]) => {
      setData({
        gdpTrend: getGDPTrend(d),
        growthRates: getGrowthRates(d),
        sectoralGVA: getSectoralGVA(d, '2011-12', 2022),
        quarterlyGDP: getQuarterlyGDP(d),
        expenditure: getExpenditureComponents(d)
      });
    });
  }, []);

  if (!data) {
    return <div className="h-[80vh] w-full flex items-center justify-center">Loading Interactive Dashboard...</div>;
  }

  // Filter out the last chapter (which was just a scroll transition marker)
  const displayChapters = chapters.filter(c => c.id < 6);

  return (
    <div className="w-full flex flex-col h-[calc(100vh-3.5rem)] pt-6">
      <div className="text-center px-4 mb-4 flex-shrink-0">
        <h1 className="text-3xl font-heading font-bold text-foreground">India's Economic Engine</h1>
        <p className="text-muted-foreground">Select a card below to explore 30 years of economic transformation.</p>
      </div>

      {/* Top Section: The Chart */}
      <div className="flex-1 w-full min-h-0 relative z-0 pb-8 px-4 md:px-12">
        <div className="w-full h-full rounded-2xl border border-border bg-card/30 overflow-hidden shadow-inner">
          <DynamicChart activeChapter={activeChapter} data={data} />
        </div>
      </div>

      {/* Bottom Section: The Carousel */}
      <div className="h-[280px] w-full flex-shrink-0 bg-muted/20 border-t border-border flex flex-col justify-center relative z-10 px-12 md:px-24">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {displayChapters.map((chapter) => (
              <CarouselItem key={chapter.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <ChapterText 
                  id={chapter.id}
                  title={chapter.title}
                  text={chapter.text}
                  isActive={activeChapter === chapter.id}
                  onHover={() => setActiveChapter(chapter.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 md:-left-12 bg-background" />
          <CarouselNext className="right-2 md:-right-12 bg-background" />
        </Carousel>
      </div>
    </div>
  );
}
