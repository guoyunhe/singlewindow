import axios from 'axios';
import fs from 'fs';
import { parse } from 'node-html-parser';

function cleanName(input) {
  return input
    .replaceAll(/\(the\)/g, '')
    .replaceAll(/\[.*\]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

const countryNameMap = {
  'Bolivia (Plurinational State of)': 'Bolivia',
  'Russian Federation': 'Russia',
  'Iran (Islamic Republic of)': 'Iran',
  "Korea (the Democratic People's Republic of)": 'North Korea',
  'Korea (the Republic of)': 'South Korea',
  'Syrian Arab Republic': 'Syria',
  'Taiwan (Province of China)': 'Taiwan',
  Macao: 'Macau',
  'Viet Nam': 'Vietnam',
  'Moldova (the Republic of)': 'Moldova',
  'Brunei Darussalam': 'Brunei',
  'Venezuela (Bolivarian Republic of)': 'Venezuela',
  'United States of America': 'United States',
  'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
  'Tanzania, the United Republic of': 'Tanzania',
};

(async () => {
  const countries = [];

  await (async () => {
    const html = await axios.get(
      'http://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes'
    );

    const root = parse(String(html.data));

    const rows = root
      .querySelector('.wikitable.sortable tbody')
      .querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.getElementsByTagName('td');
      if (cells.length === 8) {
        let name = cleanName(cells[0].textContent);
        const code = cleanName(cells[3].querySelector('span').textContent);
        const alpha3Code = cleanName(cells[4].textContent);
        const numericCode = cleanName(cells[5].textContent);
        const topLevelDomains = cleanName(cells[7].textContent)
          .split(' ')
          .filter(Boolean);

        if (countryNameMap[name]) {
          name = countryNameMap[name];
        }

        countries.push({
          name,
          code,
          alpha3Code,
          numericCode,
          topLevelDomains,
          currencyCodes: [],
        });
      }
    }
  })();

  await (async () => {
    const html = await axios.get('http://en.wikipedia.org/wiki/ISO_4217');

    const root = parse(String(html.data));

    const rows = root
      .querySelector('.wikitable.sortable tbody')
      .querySelectorAll('tr');
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.getElementsByTagName('td');
      if (cells.length === 5) {
        const code = cleanName(cells[0].textContent);
        const countryCodes = cells[4].textContent;
        let found = false;
        countries.forEach((country) => {
          if (
            countryCodes.includes('(' + country.code + ')') ||
            countryCodes.includes(country.name)
          ) {
            country.currencyCodes.push(code);
            found = true;
          }
        });
        if (!found) {
          console.log(code, countryCodes);
        }
      }
    }
  })();

  console.log(countries.length);

  const content =
    'import { CountryData } from "./CountryData";export const countryDataList: CountryData[] = ' +
    JSON.stringify(countries, null, 2) +
    ';';
  fs.writeFileSync('./src/countryDataList.ts', content);
})();
