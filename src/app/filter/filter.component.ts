import { map, Observable, of } from 'rxjs';

import 
{ 
  Component,
  ElementRef, EventEmitter, 
  Inject, Input, 
  OnChanges,
  Optional, Output, 
  SimpleChanges, ViewChild 
} from '@angular/core';

import { AbstractControl, NgModel, ValidationErrors } from '@angular/forms';
import { DateAdapter, MatDateFormats, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerInput } from '@angular/material/datepicker';

export type ItemType = "string" | "integer" | "decimal" | "date";

export interface FilterQualifier
{
  icon: string;
  value: any;
}

export interface FilterOption
{
  name: string;
  group?: string;
  alternative?: string;

  title: string;
  type: ItemType;
  qualifiers?: FilterQualifier[];
  pattern?: RegExp;
  readonly?: boolean;
  allowMultiple?: boolean;
  values?: (value: any) => Observable<any[]>;
  format?: (value: any, withTitle?: boolean) => string;
  validator?: (value: any) => Observable<ValidationErrors | null>;
}

export interface FilterItem
{
  option: FilterOption;
  value: any;
  qualifier?: FilterQualifier; 
}

@Component(
{
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnChanges
{
  @Input()
  autohideOptions: boolean = false;

  @Input()
  options: FilterOption[] = [];

  @Input()
  items: FilterItem[] = [];

  @Output()
  readonly itemsChange = new EventEmitter<FilterItem[]>();

  @Output()
  readonly search = new EventEmitter<FilterItem[]>();

  public filteredOptions: FilterOption[] = [];

  @ViewChild("optionValue") optionValue?: ElementRef<HTMLInputElement>;
  @ViewChild("dateValue") dateValue?: MatDatepickerInput<any>;
  @ViewChild("optionModel") optionModel?: NgModel;
  
  itemOption?: FilterOption|string|null = null;
  itemValue?: any|null = null;
  editItem?: FilterItem|null = null;
  popup: boolean = false;
  focusTimeout?: ReturnType<typeof setTimeout>|null = null;

  get active(): boolean
  {
    return !this.autohideOptions || this.popup || !!this.editItem || this.focusTimeout != null;
  }

  constructor(
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
      this.invalidateOptions();
    }
  }

  getOption(coerse = true): FilterOption|null
  {
    let option = this.itemOption;

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

    option = option.trim().toUpperCase();

    let match: FilterOption|null = null;

    if (option)
    {
      for(const item of this.filteredOptions) 
      {
        const title = item.title.trim().toUpperCase();

        if (title == option)
        {
          match = item;

          break;
        }
        else if (!match && title.startsWith(option))
        {
          match = item;
        }
        // No more cases.
      }

      if (match)
      {
        this.itemOption = match;
      }
    }

    return match;
  }

  convert(option: FilterOption|null, value: any): any
  {
    if (value == null)
    {
      return null;
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

  format(option: FilterOption, value: any, withTitle = true): string
  {
    if (option.format)
    {
      return option.format(value, withTitle);
    }
    else
    {
      const text = option.type == 'date' && 
        value != null &&
        this.dateAdapter &&
        this.dateFormats ?
        this.dateAdapter.format(value, this.dateFormats.display.dateInput) :
        String(value ?? '');

      return withTitle ? `${option.title}: ${text}` : text;
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
    this.itemValue = null;
    
    if (this.optionValue)
    {
      this.optionValue.nativeElement.value = "";
    }

    if (this.dateValue)
    {
      this.dateValue.value = null;
    }
  }

  remove(item: FilterItem): void 
  {
    const option = item.option;

    if (!option.readonly)
    {
      const items: FilterItem[] = [];
      let first: FilterItem|null = null;

      for(const other of this.items) 
      {
        if (other !== item && 
          (!item.option.group || item.option.group !== other.option.group))
        {
          items.push(other);
        }
        else
        {
          first ??= other;
        }
      }

      this.itemOption = first?.option;
      this.resetItemValue();
      this.editItem = null;
      this.items = items;
      this.invalidateOptions(true);
      this.itemsChange.emit(this.items);
    }
  }

  edit(item: FilterItem): void
  {
    if (!item.option.readonly)
    {
      this.editItem = item;
      this.itemOption = item.option;
      this.itemValue = item.value;
      this.invalidateOptions(true);
    }
  }

  add(): void 
  {
    const option = this.getOption();

    if (!option || this.optionModel?.invalid)
    {
      return;
    }

    let value = this.convert(option, this.itemValue);

    if (value == null)
    {
      return;
    }

    if (this.editItem?.option === option)
    {
      this.editItem.value = value;
    }
    else
    {
      if (!this.filteredOptions.includes(option))
      {
        return;
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

        this.items.push(
        { 
          option: other, 
          value: i === index ? value : null,
          qualifier: other.qualifiers?.[0]
        });
      }
    }

    this.editItem = null;
    this.resetItemValue();
    this.invalidateOptions(true);
    this.itemsChange.emit(this.items);
  }

  cancel(): void
  {
    if (this.editItem)
    {
      this.editItem = null;
      this.resetItemValue();
      this.invalidateOptions(true);
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

  invalidateOptions(focusValue = false)
  {
    let option = this.getOption();

    const alternatives = new Map(
      this.items.
        filter(item => item.option.alternative).
        map(item => [item.option.alternative!, item.option.group ?? null]));

    const used = new Set(
      this.items.
        filter(item => !item.option.allowMultiple && item !== this.editItem).
        map(item => item.option));

    this.filteredOptions = this.options.
      filter(item => !used.has(item) && 
        (!item.alternative || 
          !alternatives.has(item.alternative) ||
          alternatives.get(item.alternative) == item.group));

    if (option && !this.filteredOptions.includes(option))
    {
      option = null;
      this.itemOption = null;
      this.resetItemValue();
    }

    if (!option)
    {
      this.resetItemValue();

      for(const item of this.items) 
      {
        if (item.value == null)
        {
          this.itemOption = item.option;
          this.editItem = item; 

          break;
        }
      }

      if (this.filteredOptions.length)
      {
        this.itemOption ??= this.filteredOptions[0];
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

      if (option !== this.editItem?.option &&
        option.group && 
        option.group === this.filteredOptions[i - 1].group)
      {
        this.filteredOptions.splice(i--, 1);        
      }
    }

    this.optionModel?.control.markAsPristine();

    if (focusValue)
    {
      this.focusValue();
    }
  }

  optionChange(): void
  {
    this.editItem = null;
    this.resetItemValue();
    this.invalidateOptions(true);
  }

  focusValue(): void
  {
    if (this.focusTimeout != null)
    {
      clearTimeout(this.focusTimeout);
      this.focusTimeout = null;
    }

    this.focusTimeout = setTimeout(() => 
    {
      this.focusTimeout = null;

      if (this.optionValue)
      {
        const element = this.optionValue.nativeElement;

        element.focus();
        element.select();
      }
    });
  }

  toggleQualifier(item: FilterItem, event?: Event): void
  {
    const qualifiers = item.option.qualifiers;

    if (!item.option.readonly && qualifiers && item.qualifier)
    {
      const index = qualifiers.indexOf(item.qualifier) + 1;

      item.qualifier = qualifiers[index < qualifiers.length ? index : 0];
      event?.preventDefault();
      event?.stopPropagation();
    }
  }
}
