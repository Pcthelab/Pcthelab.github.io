export const arrowIcon = '<svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg>';
export function createArrowIcon() {
  const template = document.createElement('template');
  template.innerHTML = arrowIcon;
  return template.content.firstElementChild;
}
