'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
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
    // Set page width based on container
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.offsetWidth - 32); // Account for padding
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
    // Measure the actual rendered page height after it loads
    setTimeout(() => {
      if (pdfContainerRef.current) {
        const pdfPage =
          pdfContainerRef.current.querySelector('.react-pdf__Page');
        if (pdfPage) {
          const height = pdfPage.getBoundingClientRect().height;
          if (height > 0) {
            setContainerHeight(height + 40); // Add padding
          }
        }
      }

      // Restore scroll position after page change
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }, 100);
  };

  // Save scroll position before page change
  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
    setSlideDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      goToNextPage();
    } else if (e.key === 'ArrowLeft') {
      goToPrevPage();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  return (
    <>
      <div
        ref={containerRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* PDF Display */}
        <div
          ref={pdfContainerRef}
          className="relative bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden"
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
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      Loading PDF...
                    </p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8">
                  <p className="text-red-600 dark:text-red-400">
                    Failed to load PDF
                  </p>
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

          {/* Navigation Buttons */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Page Indicator */}
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Slide {currentPage} / {totalPages}
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex gap-2 overflow-x-auto max-w-lg">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex-shrink-0 w-3 h-3 rounded-full transition-all ${
                  page === currentPage
                    ? 'bg-blue-600 w-6'
                    : 'bg-gray-400 dark:bg-gray-500 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${page}`}
              />
            ))}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Swipe or use arrow keys
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          Navigation Tips
        </h3>
        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Swipe left/right to navigate slides</li>
          <li>• Use arrow keys (← →) for keyboard navigation</li>
          <li>• Click the buttons on the sides to move between slides</li>
          <li>
            • Click the page indicators at the bottom to jump to a specific
            slide
          </li>
        </ul>
      </div>
    </>
  );
}
