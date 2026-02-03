// DOM utility functions

import { logger } from './logger';

// Wait for element to appear in DOM
export function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Check if element is visible
export function isElementVisible(element: Element): boolean {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

// Get element text content safely
export function getTextContent(element: Element | null): string | null {
  if (!element) return null;
  return element.textContent?.trim() || null;
}

// Get element attribute safely
export function getAttribute(
  element: Element | null,
  attribute: string
): string | null {
  if (!element) return null;
  return element.getAttribute(attribute);
}

// Query selector with error handling
export function safeQuerySelector(
  selector: string,
  container: Document | Element = document
): Element | null {
  try {
    return container.querySelector(selector);
  } catch (error) {
    logger.error('Invalid selector', { selector, error });
    return null;
  }
}

// Query all selectors with error handling
export function safeQuerySelectorAll(
  selector: string,
  container: Document | Element = document
): Element[] {
  try {
    return Array.from(container.querySelectorAll(selector));
  } catch (error) {
    logger.error('Invalid selector', { selector, error });
    return [];
  }
}

// Create element with attributes
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (children) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  return element;
}

// Remove element safely
export function removeElement(selector: string): void {
  const element = document.querySelector(selector);
  if (element) {
    element.remove();
  }
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Get scroll position
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
}

// Check if element is in viewport
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
