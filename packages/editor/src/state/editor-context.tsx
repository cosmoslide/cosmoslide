import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import { nanoid } from 'nanoid';
import type {
  Presentation,
  Slide,
  SlideElement,
  SlideDimensions,
  TextElement,
} from '../types/slide';
import { DEFAULT_DIMENSIONS } from '../types/slide';

// --- State ---

export interface EditorState {
  presentation: Presentation;
  activeSlideIndex: number;
  selectedElementIds: string[];
  previewMode: boolean;
}

function createDefaultSlide(sortOrder: number): Slide {
  return {
    id: nanoid(),
    elements: [],
    background: '#ffffff',
    sortOrder,
  };
}

function createDefaultPresentation(): Presentation {
  return {
    id: nanoid(),
    title: 'Untitled Presentation',
    dimensions: DEFAULT_DIMENSIONS,
    slides: [createDefaultSlide(0)],
  };
}

export function createInitialState(): EditorState {
  return {
    presentation: createDefaultPresentation(),
    activeSlideIndex: 0,
    selectedElementIds: [],
    previewMode: false,
  };
}

// --- Actions ---

export type EditorAction =
  | { type: 'ADD_SLIDE' }
  | { type: 'DELETE_SLIDE'; slideId: string }
  | { type: 'SELECT_SLIDE'; index: number }
  | { type: 'ADD_ELEMENT'; element: SlideElement }
  | {
      type: 'UPDATE_ELEMENT';
      elementId: string;
      updates: Partial<SlideElement>;
    }
  | { type: 'DELETE_ELEMENT'; elementId: string }
  | { type: 'SELECT_ELEMENT'; elementId: string | null }
  | { type: 'SET_DIMENSIONS'; dimensions: SlideDimensions }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'DUPLICATE_SLIDE'; slideId: string }
  | { type: 'INSERT_SLIDE_AFTER'; afterIndex: number };

// --- Reducer ---

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  const { presentation, activeSlideIndex } = state;

  switch (action.type) {
    case 'ADD_SLIDE': {
      const newSlide = createDefaultSlide(presentation.slides.length);
      const slides = [...presentation.slides, newSlide];
      return {
        ...state,
        presentation: { ...presentation, slides },
        activeSlideIndex: slides.length - 1,
        selectedElementIds: [],
      };
    }

    case 'DELETE_SLIDE': {
      if (presentation.slides.length <= 1) return state;
      const slides = presentation.slides.filter((s) => s.id !== action.slideId);
      const newIndex = Math.min(activeSlideIndex, slides.length - 1);
      return {
        ...state,
        presentation: { ...presentation, slides },
        activeSlideIndex: newIndex,
        selectedElementIds: [],
      };
    }

    case 'SELECT_SLIDE': {
      if (action.index < 0 || action.index >= presentation.slides.length)
        return state;
      return {
        ...state,
        activeSlideIndex: action.index,
        selectedElementIds: [],
      };
    }

    case 'ADD_ELEMENT': {
      const slides = presentation.slides.map((slide, i) => {
        if (i !== activeSlideIndex) return slide;
        return { ...slide, elements: [...slide.elements, action.element] };
      });
      return {
        ...state,
        presentation: { ...presentation, slides },
        selectedElementIds: [action.element.id],
      };
    }

    case 'UPDATE_ELEMENT': {
      const slides = presentation.slides.map((slide, i) => {
        if (i !== activeSlideIndex) return slide;
        return {
          ...slide,
          elements: slide.elements.map((el) =>
            el.id === action.elementId ? { ...el, ...action.updates } : el,
          ),
        };
      });
      return {
        ...state,
        presentation: { ...presentation, slides },
      };
    }

    case 'DELETE_ELEMENT': {
      const slides = presentation.slides.map((slide, i) => {
        if (i !== activeSlideIndex) return slide;
        return {
          ...slide,
          elements: slide.elements.filter((el) => el.id !== action.elementId),
        };
      });
      return {
        ...state,
        presentation: { ...presentation, slides },
        selectedElementIds: state.selectedElementIds.filter(
          (id) => id !== action.elementId,
        ),
      };
    }

    case 'SELECT_ELEMENT': {
      return {
        ...state,
        selectedElementIds: action.elementId ? [action.elementId] : [],
      };
    }

    case 'SET_DIMENSIONS': {
      return {
        ...state,
        presentation: { ...presentation, dimensions: action.dimensions },
      };
    }

    case 'SET_TITLE': {
      return {
        ...state,
        presentation: { ...presentation, title: action.title },
      };
    }

    case 'TOGGLE_PREVIEW': {
      return {
        ...state,
        previewMode: !state.previewMode,
        selectedElementIds: [],
      };
    }

    case 'DUPLICATE_SLIDE': {
      const sourceIndex = presentation.slides.findIndex(
        (s) => s.id === action.slideId,
      );
      if (sourceIndex === -1) return state;
      const source = presentation.slides[sourceIndex];
      const clone: Slide = {
        ...source,
        id: nanoid(),
        elements: source.elements.map((el) => ({ ...el, id: nanoid() })),
        sortOrder: sourceIndex + 1,
      };
      const slides = [...presentation.slides];
      slides.splice(sourceIndex + 1, 0, clone);
      return {
        ...state,
        presentation: { ...presentation, slides },
        activeSlideIndex: sourceIndex + 1,
        selectedElementIds: [],
      };
    }

    case 'INSERT_SLIDE_AFTER': {
      const newSlide = createDefaultSlide(action.afterIndex + 1);
      const slides = [...presentation.slides];
      slides.splice(action.afterIndex + 1, 0, newSlide);
      return {
        ...state,
        presentation: { ...presentation, slides },
        activeSlideIndex: action.afterIndex + 1,
        selectedElementIds: [],
      };
    }

    default:
      return state;
  }
}

// --- Context ---

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  /** The currently active slide */
  activeSlide: Slide;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    editorReducer,
    undefined,
    createInitialState,
  );
  const activeSlide = state.presentation.slides[state.activeSlideIndex];

  return (
    <EditorContext.Provider value={{ state, dispatch, activeSlide }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return ctx;
}

// --- Helper: create a default text element ---

export function createTextElement(
  overrides?: Partial<TextElement>,
): TextElement {
  return {
    id: nanoid(),
    type: 'text',
    x: 100,
    y: 100,
    width: 300,
    height: 60,
    rotation: 0,
    content: 'Double-click to edit',
    fontSize: 24,
    fontFamily: 'Arial',
    textAlign: 'left',
    color: '#000000',
    ...overrides,
  };
}
