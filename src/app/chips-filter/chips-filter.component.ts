import { map, Observable, of } from 'rxjs';

import 
{ 
  Component,
  ElementRef,
  EventEmitter, 
  Inject, 
  Input, 
  OnChanges,
  Optional, 
  Output, 
  SimpleChanges, 
  ViewChild 
} from '@angular/core';

import { AbstractControl, NgModel, ValidationErrors } from '@angular/forms';
import { DateAdapter, MatDateFormats, MAT_DATE_FORMATS } from '@angular/material/core';

export type ItemType = "string" | "integer" | "decimal" | "date" | "tag";

export interface FilterQualifier
{
  icon?: string|null;
  value?: any;
}

export interface FilterOption
{
  name?: string;
  group?: string;
  alternative?: string;

  title: string;
  type: ItemType;
  qualifiers?: FilterQualifier[];
  pattern?: RegExp;
  required?: boolean;
  readonly?: boolean;
  allowMultiple?: boolean;
  values?: (value: any) => Observable<readonly any[]>;
  format?: (value: any, withTitle?: boolean) => string;
  convert?: (value: any) => any;
  validator?: (value: any) => Observable<ValidationErrors | null>;
  order?: number;
}

export interface FilterItem
{
  option: FilterOption;
  value?: any;
  qualifier?: FilterQualifier|null; 
}

type WeakFilterItem = Omit<FilterItem, "option"> & {option?: FilterOption|string|null};

const tagQualifiers: FilterQualifier[] =
[
  {
    icon: "check",
    value: true
  },
  {
    icon: null,
    value: false
  }
]

export type OptionsStyle = "visible" | "hideInactive" | "shadowInactive";

@Component(
{
  selector: 'chips-filter',
  templateUrl: './chips-filter.component.html',
  styleUrls: ['./chips-filter.component.css'],
  exportAs: "chipsFilter"
})
export class ChipsFilterComponent implements OnChanges
{
  @Input()
  optionsStyle: OptionsStyle = "hideInactive";

  @Input()
  options: FilterOption[] = [];

  @Input()
  items: FilterItem[] = [];

  @Output()
  readonly itemsChange = new EventEmitter<FilterItem[]>();

  @Output()
  readonly search = new EventEmitter<FilterItem[]>();

  public filteredOptions: FilterOption[] = [];

  @ViewChild("optionType") optionType?: ElementRef<HTMLInputElement>;
  @ViewChild("optionValue") optionValue?: ElementRef<HTMLInputElement>;
  @ViewChild("optionValue", { read: NgModel }) optionModel?: NgModel;

  item: WeakFilterItem = {};
  editItem?: FilterItem|null = null;
  popup: boolean = false;
  focusTimeout?: ReturnType<typeof setTimeout>|null = null;

  get active(): boolean
  {
    return this.popup || !!this.editItem || this.focusTimeout != null;
  }

  constructor(
    private element: ElementRef<HTMLElement>,
    @Optional() 
    private dateAdapter: DateAdapter<any>|null,
    @Optional() @Inject(MAT_DATE_FORMATS) 
    private dateFormats: MatDateFormats|null)
  {
    this.validate = this.validate.bind(this);
    this.formatValue = this.formatValue.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void 
  {
    if ("options" in changes || "items" in changes)
    {
      for(const item of this.items) 
      {
        if (item.option?.type === "tag" && !item.qualifier)
        {
          item.qualifier = tagQualifiers[item.value ? 0 : 1];
        }  
      }

      this.updateOptions();
      this.sortItems(this.items);
    }
  }

  getOption(coerse = true): FilterOption|null
  {
    return this.getItemOption(this.item, coerse);
  }

  getItemOption(item: WeakFilterItem, coerse = true): FilterOption|null
  {
    let option = item.option;

    if (option == null)
    {
      return null;
    }

    if (typeof option !== "string")
    {
      return option;
    }

    if (!coerse)
    {
      return null;
    }

    let match: FilterOption|null = null;
    const text = option.trim().toUpperCase();

    if (text)
    {
      for(const item of this.filteredOptions) 
      {
        const title = item.title.trim().toUpperCase();

        if (title == text)
        {
          match = item;

          break;
        }
        else if (!match && title.startsWith(text))
        {
          match = item;
        }
        // No more cases.
      }
    }

    match ??= this.filteredOptions[0];
    item.option = match;

    return match;
  }

  convert(option: FilterOption|null, value: any): any
  {
    if (value == null)
    {
      return null;
    }

    if (option?.convert)
    {
      return option.convert(value);
    }

    switch(option?.type)
    {
      case 'integer':
      {
        value = parseInt(value);

        return isNaN(value) ? undefined : value;
      }
      case 'decimal':
      {
        value = parseFloat(typeof value === "string" ? value.replace(/[\s,]/g, '') : value);

        return isNaN(value) ? undefined : value;
      }
      default:
      {
        return value;
      }
    }
  }

  format(option: FilterOption, value: any, detailed = true): string
  {
    if (option.format)
    {
      return option.format(value, detailed);
    }
    else
    {
      const text = option.type == 'date' && 
        value != null &&
        this.dateAdapter &&
        this.dateFormats ?
        this.dateAdapter.format(value, this.dateFormats.display.dateInput) :
        String(value ?? '');

      return detailed ? `${option.title}: ${text}` : text;
    }
  }

  formatOption(option: FilterOption|null): string
  {
    return option?.title ?? "";
  }

  formatValue(value: any): string
  {
    const option = this.getOption();

    return option ? this.format(option, value, false) : "";
  }

  resetItemValue(): void
  {
    const option = this.getOption();
    let qualifier = option?.qualifiers?.[0] ?? null;
    let value = null;

    if (option?.type === "tag")
    {
      qualifier ??= tagQualifiers[0];
      value = qualifier.value;
    }

    this.item.value = value;
    this.item.qualifier = qualifier;
  }

  remove(item: FilterItem): void 
  {
    const option = item.option;

    if (!option.readonly && !option.required)
    {
      const items: FilterItem[] = [];
      let first: FilterItem|null = null;

      for(const other of this.items) 
      {
        if (other !== item && 
          (!item.option!.group || item.option!.group !== other.option!.group))
        {
          items.push(other);
        }
        else
        {
          first ??= other;
        }
      }

      this.item.option = first?.option;
      this.resetItemValue();
      this.editItem = null;
      this.items = items;
      this.updateOptions();
      this.focusValue();
      this.itemsChange.emit(this.items);
    }
  }

  edit(item: FilterItem, event?: Event|null, focusType?: boolean): boolean
  {
    if (!item.option!.readonly)
    {
      if (item.option!.type === "tag")
      {
        return this.toggleQualifier(item, event);
      }
      else
      {
        this.editItem = item;
        this.item.option = item.option;
        this.item.value = item.value;
        this.item.qualifier = item.qualifier;
        this.updateOptions();
        this.focusValue(focusType);
        event?.preventDefault();
        event?.stopPropagation();

        return true;
      }
    }

    return false;
  }

  add(keepEdit?: boolean)
  {
    const option = this.getOption();

    if (!option || this.optionModel?.invalid)
    {
      return;
    }

    let value = this.convert(option, this.item.value);

    if (option.type === "tag")
    {
      this.item.option = null;
    }
    else
    {
      if (value == null)
      {
        return;
      }
    }

    let editItem: FilterItem|null = null;

    if (this.editItem?.option === option)
    {
      if (keepEdit)
      {
        editItem = this.editItem;
      }

      this.editItem.value = value;
      this.editItem.qualifier = this.item.qualifier;
    }
    else
    {
      if (!this.filteredOptions.includes(option))
      {
        return;
      }

      if (!option.allowMultiple && option.alternative)
      {
        for(let i = this.items.length; i--;) 
        {
          const item = this.items[i];

          if (item.option.alternative === option.alternative)
          {
            this.items.splice(i, 1);
          }
        }
      }

      const options = this.options;
      const index = options.indexOf(option);
      let startGroup = index;
      let endGroup = index;
  
      if (option.group)
      {
        while(startGroup > 0 && options[startGroup - 1].group === option.group)
        {
          --startGroup;
        }
  
        while(endGroup < options.length - 1 && 
          options[endGroup + 1].group === option.group)
        {
          ++endGroup;
        }
      }

      for(let i = startGroup; i <= endGroup; ++i)
      {
        const other = options[i];
        let qualifier = other.qualifiers?.[0];

        const item = 
        { 
          option: other, 
          value: i === index || other.type == option.type ? value : null,
          qualifier: qualifier
        };

        if (other.type === "tag")
        {
          if (!qualifier)
          {
            qualifier = tagQualifiers[value ? 0 : 1];
            item.qualifier = qualifier;  
          }

          if (item.value == null)
          {
            item.value = item.qualifier?.value;
          }
        }

        if (other === option &&
          option.alternative &&
          option.alternative === this.editItem?.option.alternative)
        {
          editItem = item;
        }

        this.items.push(item);
      }
    }

    const lastOption = this.editItem?.option;

    this.editItem = editItem;

    if (editItem)
    {
      this.item.option = editItem.option;
      this.item.value = editItem.value;
      this.item.qualifier = editItem.qualifier;
    }
    else
    {
      this.resetItemValue();
    }

    this.updateOptions(lastOption);
    this.sortItems(this.items);
    this.itemsChange.emit(this.items);
    this.focusValue();
  }

  cancel(focus = false): void
  {
    if (this.editItem)
    {
      this.editItem = null;
      this.resetItemValue();
      this.updateOptions();

      if (focus)
      {
        this.focusValue();
      }
    }
  }

  validate(control: AbstractControl): Observable<ValidationErrors|null>
  {
    const option = this.getOption();
    let value = control.value;

    if (!option || value == null)
    {
      return of(null);
    }

    if (option.pattern?.test(String(value)) == false)
    {
      return of({ pattern: "invalid pattern" });
    }

    if (option.validator)
    {
      return option.validator(value);
    }

    value = this.convert(option, value);

    if (value == null)
    {
      return of(null);
    }

    return option.values?.(value)?.
      pipe(map(values => values.length === 1 ? null : { value: "invalid value" })) ??
      of(null);
  }

  updateOptions(lastOption?: FilterOption|null)
  {
    let option = this.getOption();
    const editOption = this.editItem?.option;

    const alternatives = new Map(
      this.items.
        filter(item => 
          item.option.alternative && 
          item.option.alternative !== editOption?.alternative).
        map(item => [item.option.alternative!, item.option.group ?? null]));

    const used = new Set(
      this.items.
        filter(item => !item.option.allowMultiple && item !== this.editItem).
        map(item => item.option));

    this.filteredOptions = this.options.
      filter(item => !used.has(item) && 
        (!editOption ?
          (!item.alternative || 
            !alternatives.has(item.alternative) ||
            alternatives.get(item.alternative) == item.group) :
        (editOption == item) ||
        (editOption.alternative && (editOption.alternative === item.alternative))));

    if (option && !this.filteredOptions.includes(option))
    {
      option = null;
      this.item.option = null;
      this.resetItemValue();
    }

    if (!option)
    {
      this.resetItemValue();

      if (lastOption?.group)
      {
        let found = false;

        for(const item of this.items)
        {
          if (!found)
          {
            if (item.option === lastOption)
            {
              found = true;
            }
          }
          else
          {
            if (item.option.group === lastOption.group &&
              !item.option.readonly &&
              item.option.type !== "tag")
            {
              this.item.option = item.option;
              this.item.value = item.value;
              this.item.qualifier = item.qualifier;
              this.editItem = item; 
    
              break;
            }
          }
        }
      }

      if (!this.editItem)
      {
        for(const item of this.items) 
        {
          if (item.value == null && item.option.type !== "tag")
          {
            this.item.option = item.option;
            this.editItem = item; 

            break;
          }
        }
      }

      if (this.filteredOptions.length)
      {
        this.item.option ??= this.filteredOptions[0];
      }
      else
      {
        if (this.editItem)
        {
          this.filteredOptions.push(this.editItem.option);
        }
      }
    }

    for(let i = 1; i < this.filteredOptions.length; ++i)
    {
      const option = this.filteredOptions[i];

      if (option !== editOption &&
        ((option.group && 
        option.group === this.filteredOptions[i - 1].group ||
        option.alternative &&
        option.alternative === editOption?.alternative &&
        !option.required &&
        editOption.required)))
      {
        this.filteredOptions.splice(i--, 1);        
      }
    }

    this.optionModel?.control.markAsPristine();
  }

  optionChange(): void
  {
    const option = this.getOption();
    const editOption = this.editItem?.option;

    if (option && option.alternative && option.alternative == editOption?.alternative)
    {
      if (option.type !== editOption.type)
      {
        this.resetItemValue();
      }

      this.add(true);
    }
    else if (option?.type === "tag")
    {
      setTimeout(() => this.add(true));
    }
    else
    {
      this.editItem = null;
      this.resetItemValue();
      this.updateOptions();
      this.focusValue();
    }
  }

  focusValue(focusType?: boolean): void
  {
    if (this.focusTimeout != null)
    {
      clearTimeout(this.focusTimeout);
      this.focusTimeout = null;
    }

    this.focusTimeout = setTimeout(() => 
    {
      this.focusTimeout = null;

      const element = focusType ?
        this.optionType?.nativeElement :
        this.optionValue?.nativeElement;

      element?.focus();
      element?.select();
    });
  }

  toggleQualifier(item: WeakFilterItem, event?: Event|null): boolean
  {
    const option = this.getItemOption(item);

    if (!option)
    {
      return false;
    }

    const tag = option.type === "tag";
    const qualifiers = option.qualifiers ?? (tag ? tagQualifiers : null);

    if (!option.readonly && qualifiers && item.qualifier)
    {
      const index = qualifiers.indexOf(item.qualifier) + 1;

      item.qualifier = qualifiers[index < qualifiers.length ? index : 0];

      if (tag)
      {
        item.value = item.qualifier?.value; 
      }

      if (this.items.includes(item as FilterItem))
      {
        this.itemsChange.emit(this.items);
      }

      event?.preventDefault();
      event?.stopPropagation();

      return true;
    }

    return false;
  }

  sortItems(items: FilterItem[]): void
  {
    const index: Map<FilterOption, number> = new Map();
    let option: FilterOption|null = null;
    let value: number = -1; 

    for(const item of this.options) 
    {
      if (!item.group || item.group !== option?.group)  
      {
        option = item;
        ++value;
      }

      index.set(item, value);
    }

    items.sort((f, s) => (index.get(f.option) ?? -1) - (index.get(s.option) ?? -1));
  }

  togglePopup(value: boolean)
  {
    this.popup = value;

    this.focusTimeout ??= setTimeout(() => 
    {
      this.focusTimeout = null;

      if (!this.element.nativeElement.matches(":focus-within"))
      {
        this.cancel(false);
      }
    });
  }

  updateFocus()
  {
    this.focusTimeout ??= setTimeout(() => 
    {
      this.focusTimeout = null;

      if (!this.popup && 
        !this.element.nativeElement.matches(":focus-within") &&
        this.editItem &&
        this.editItem.value === this.item.value)
      {
        this.cancel(false);
      }
    });
  }
}
