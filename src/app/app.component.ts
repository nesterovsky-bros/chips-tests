import { Component } from '@angular/core';
import { of } from 'rxjs';
import { FilterItem, FilterOption, FilterQualifier } from './chips-filter/chips-filter.component';

const branches = [172, 680];

type Column = { name: string, label: string };

const sortableColumns: Column[] =
[
  {
    name: "correctnessDate",
    label: "תאריך"
  },
  {
    name: "account",
    label: "חשבון"
  },
  {
    name: "amount",
    label: "סכום"
  }
];

const orderQualifiers: FilterQualifier[] =
[
  { 
    icon: "arrow_upward",
    value: "ascending"
  },
  { 
    icon: "arrow_downward",
    value: "descending"
  },
];

const allOptions: FilterOption[] =
[
  {
    name: "report",
    title: "דוח",
    type: 'integer',
    readonly: true
  },
  {
    name: "branch",
    title: "סניף",
    type: 'integer',
    required: true,
    pattern: /\d{3}/,
    values: (value: any) =>
    {
      let list = branches;

      if (value != null)
      {
        value = String(value).trim().toUpperCase();

        list = list.filter(item => String(item).trim().toUpperCase().includes(value));
      }

      return of(list);
    } 
  },
  {
    name: "correctnessDate",
    alternative: "correctnessDate",
    title: "תאריך",
    type: 'date'
  },
  {
    name: "correctnessDate.from",
    alternative: "correctnessDate",
    group: "correctnessDate.range",
    title: "תאריך מ",
    type: 'date'
  },
  {
    name: "correctnessDate.to",
    alternative: "correctnessDate",
    group: "correctnessDate.range",
    title: "תאריך עד",
    type: 'date'
  },
  {
    name: "account",
    title: "חשבון",
    type: 'string',
    pattern: /\d{4,}/,
  },
  {
    name: "amount",
    alternative: "amount",
    title: "סכום",
    type: 'decimal'
  },
  // {
  //   name: "amount.from",
  //   alternative: "amount",
  //   group: "amount",
  //   title: "סכום מ",
  //   type: 'decimal'
  // },
  // {
  //   name: "amount.to",
  //   alternative: "amount",
  //   group: "amount",
  //   title: "סכום עד",
  //   type: 'decimal'
  // },

  {
    name: "order",
    title: "מיון",
    type: 'string',
    qualifiers: orderQualifiers,
    values: () => of(sortableColumns),
    format: function(value: Column|string|null, withTitle?: boolean)
    {
      const text = value == null ? "" :
        typeof value === "string" ? value :
        value.label;

      return withTitle ? `${this.title}: ${text}` : (text);
    },
    validator: (value?: Column|string|null) =>
    {
      if (value == null)
      {
        return of(null);
      }

      const text = (typeof value === "string" ? value : value.label).trim().toUpperCase();

      if (sortableColumns.find(item => item.label.trim().toUpperCase() === text))
      {
        return of(null);
      }

      return of({ value: "Invalid value"});
    }
  }
];

const [reportOption, branchOption, dateOption, accountOption] = allOptions;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'chips-tests';

  options = allOptions;

  items: FilterItem[] = 
  [
    { option: reportOption, value: 1203001 },
    { option: branchOption, value: 680 },
  ];

  autohide: boolean = true;
  searchCount: number = 0;
}
