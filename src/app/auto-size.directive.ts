import { Directive, ElementRef, OnDestroy, OnInit } from "@angular/core";

@Directive({ selector: "input[autoSize]" })
export class AutoSizeDirective implements OnInit, OnDestroy
{
  private view?: HTMLElement;

  constructor(private element: ElementRef<HTMLInputElement>) 
  {
    this.updateView = this.updateView.bind(this);
    this.element.nativeElement.addEventListener("input", this.updateView);
  }

  ngOnInit(): void 
  {
    this.view = this.element.nativeElement.ownerDocument.createElement("div");
    this.view.style.visibility = "hidden";
    this.view.style.position = "absolute";
    this.element.nativeElement.parentElement?.append(this.view);
    this.updateView();

    // Update later in case of value is changed.
    setTimeout(() => this.updateView());
  }

  ngOnDestroy(): void 
  {
    this.element.nativeElement.removeEventListener("input", this.updateView);
    this.view?.remove();
  }

  updateView()
  {
    if (this.view)
    {
      this.view.textContent = this.element.nativeElement.value;

      const bounds = this.view.getBoundingClientRect(); 

      this.element.nativeElement.style.width = `${bounds.width}px`;
    }
  }
}
