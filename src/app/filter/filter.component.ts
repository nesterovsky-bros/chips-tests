import { Component, DoCheck, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ENTER} from '@angular/cdk/keycodes';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { NgModel } from '@angular/forms';
import * as moment from 'moment';

export enum ItemType
{
  String,
  Integer,
  Decimal,
  Date,

  Group,
  Alternative
}

export interface FilterOption
{
  title: string;
  type: ItemType;
  pattern?: RegExp|null;
  readonly?: boolean|null;
  required?: boolean|null;
  allowMultiple?: boolean|null;
  values?: Observable<any[]>|null;
  format?: (value: any) => string;
  options?: FilterOption[]|null;
}

export interface FilterItem
{
  option: FilterOption;
  value: any;
}

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit, OnChanges, DoCheck
{
  @Input()
  autohideOptions: boolean = false;

  @Input()
  get options(): FilterOption[]
  {
    return this._options;
  }

  set options(value: FilterOption[])
  {
    this._options = value ?? [];
  }

  @Input()
  get items(): FilterItem[]
  {
    return this._items;
  }

  set items(value: FilterItem[])
  {
    this._items = value ?? [];
  }

  @Output()
  readonly itemsChange = new EventEmitter<FilterItem[]>();

  @Output()
  readonly search = new EventEmitter<FilterItem[]>();

  public filteredOptions: FilterOption[] = [];
  private _options: FilterOption[] = [];
  private _items: FilterItem[] = [];
  protected optionText: string = "";

  readonly separatorKeysCodes = [ENTER] as const;
  readonly ItemType = ItemType;

  @ViewChild("optionValue") optionValue: ElementRef<HTMLInputElement>|null = null;
  @ViewChild("optionModel") optionModel: NgModel|null = null;

  itemOption?: FilterOption|null = null;
  itemValue: any|null = null;
  editItem?: FilterItem|null = null;
  popup: boolean = false;

  ngOnInit(): void 
  {
    this.invalidateOptions();
  }
  
  ngDoCheck(): void 
  {
    this.optionText = this.optionValue?.nativeElement.value ?? "";
  }

  ngOnChanges(changes: SimpleChanges): void 
  {
    if ("options" in changes || "items" in changes)
    {
      this.invalidateOptions();
    }
  }

  format(option: FilterOption, value: any): string
  {
    return option.format ? option.format(value) :
      moment.isMoment(value) ? 
        `${option.title}: ${value.format("l")}` :
        `${option.title}: ${value}`;
  }

  formatOption(option: FilterOption)
  {
    return option.title;
  }

  remove(item: FilterItem): void 
  {
    if (!item.option.readonly)
    {
      const index = this.items.indexOf(item);

      if (index >= 0) 
      {
        this.items.splice(index, 1);
        this.itemOption = item.option;
        this.itemValue = null;
        this.editItem = null;
        this.invalidateOptions(true);
        this.itemsChange.emit(this.items);
      }
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
    if (this.optionModel && !this.optionModel.valid)
    {
      return;
    }

    const option = this.itemOption;

    if (!option)
    {
      return;
    }

    let value = this.itemValue;
    let valid = false;

    switch(this.itemOption?.type)
    {
      case ItemType.Integer:
      {
        value = parseInt(value);
        valid = !isNaN(value);

        break;
      }
      case ItemType.Decimal:
      {
        value = parseFloat(typeof value === "string" ? value.replace(/[\s,]/g, '') : value);
        valid = !isNaN(value);

        break;
      }
      case ItemType.String:
      case ItemType.Date:
      {
        valid = true;

        break;
      }
    }

    if (value && valid)
    {
      if (this.editItem?.option !== option)
      {
        this.items.push({ option, value });
      }
      else
      {
        this.editItem!.value = value;
      }

      this.itemValue = null;
      this.editItem = null;
      this.invalidateOptions(true);
      this.itemsChange.emit(this.items);
    }
  }

  cancel(): void
  {
    if (this.editItem)
    {
      setTimeout(() => 
      {
        this.editItem = null;
        this.itemValue = null;
        this.invalidateOptions(true);
      });
    }
  }

  invalidateOptions(focusValue = false)
  {
    const used = new Set(
      this.items.
        filter(item => !item.option.allowMultiple && item !== this.editItem).
        map(item => item.option));

    const flatOptions: FilterOption[] = [];
    //const relations: = new Map();

    
    this.filteredOptions = this.options.filter(item => !used.has(item));

    if (this.itemOption && !this.filteredOptions.includes(this.itemOption))
    {
      this.itemOption = null;
      this.itemValue = null;
    }

    if (!this.itemOption && this.filteredOptions.length)
    {
      this.itemOption = this.filteredOptions[0];
      this.itemValue = null;
    }

    this.optionModel?.control.markAsPristine();

    if (focusValue)
    {
      this.focusValue();
    }
  }

  optionChange(): void
  {
    this.itemValue = null;
    this.editItem = null;
    this.invalidateOptions(true);
  }

  focusValue(): void
  {
    setTimeout(() => 
    {
      if (this.optionValue)
      {
        const element = this.optionValue.nativeElement;

        element.focus();
        element.select();
      }
    }, 
    100);
  }
}
