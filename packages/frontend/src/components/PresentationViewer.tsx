import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PresentationViewerProps {
  pdfUrl: string;
  title: string;
}

export default function PresentationViewer({
  pdfUrl,
  title,
}: PresentationViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(
    null,
  );
  const [containerHeight, setContainerHeight] = useState<number>(600);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth - 32);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
  };

  const onPageLoadSuccess = () => {
    setTimeout(() => {
      if (pdfContainerRef.current) {
        const pdfPage =
          pdfContainerRef.current.querySelector('.react-pdf__Page');
        if (pdfPage) {
          const height = pdfPage.getBoundingClientRect().height;
          if (height > 0) {
            setContainerHeight(height + 40);
          }
        }
      }

      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }, 100);
  };

  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0]?.clientX || 0);
    setIsSwiping(true);
    setSlideDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.targetTouches[0]?.clientX || 0;
    const delta = currentTouch - touchStart;

    setTouchEnd(currentTouch);
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (!touchStart || touchEnd === 0) {
      setIsSwiping(false);
      setTouchDelta(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < totalPages) {
      saveScrollPosition();
      setSlideDirection('left');
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setSlideDirection(null);
      }, 100);
    } else if (isRightSwipe && currentPage > 1) {
      saveScrollPosition();
      setSlideDirection('right');
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setSlideDirection(null);
      }, 100);
    }

    setIsSwiping(false);
    setTouchStart(0);
    setTouchEnd(0);
    setTouchDelta(0);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      saveScrollPosition();
      setSlideDirection('left');
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setSlideDirection(null);
      }, 100);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      saveScrollPosition();
      setSlideDirection('right');
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setSlideDirection(null);
      }, 100);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  return (
    <>
      <Card
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={pdfContainerRef}
          className="relative bg-muted flex items-center justify-center overflow-hidden"
          style={{ height: `${containerHeight}px`, minHeight: '600px' }}
        >
          <div
            className="transition-all duration-300 ease-out"
            style={{
              transform: isSwiping
                ? `translateX(${touchDelta}px)`
                : slideDirection === 'left'
                  ? 'translateX(-100%)'
                  : slideDirection === 'right'
                    ? 'translateX(100%)'
                    : 'translateX(0)',
              opacity: isSwiping
                ? Math.max(0.3, 1 - Math.abs(touchDelta) / 300)
                : slideDirection
                  ? 0
                  : 1,
            }}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Spinner className="size-12 text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8">
                  <p className="text-destructive">Failed to load PDF</p>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth || undefined}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>
          </div>

          <Button
            variant="secondary"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-6" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
            aria-label="Next slide"
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>

        <div className="bg-muted px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-foreground">
            Slide {currentPage} / {totalPages}
          </div>

          <div className="flex gap-2 overflow-x-auto max-w-lg">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'flex-shrink-0 h-3 rounded-full transition-all',
                  page === currentPage
                    ? 'bg-primary w-6'
                    : 'bg-muted-foreground/40 w-3 hover:bg-muted-foreground/60',
                )}
                aria-label={`Go to slide ${page}`}
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Swipe or use arrow keys
          </div>
        </div>
      </Card>

      <Alert className="mt-6">
        <AlertTitle>Navigation Tips</AlertTitle>
        <AlertDescription>
          <ul className="text-xs space-y-1 mt-1">
            <li>Swipe left/right to navigate slides</li>
            <li>Use arrow keys for keyboard navigation</li>
            <li>Click the buttons on the sides to move between slides</li>
            <li>
              Click the page indicators at the bottom to jump to a specific
              slide
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </>
  );
}
