# TechGear REST API databas - Inlämmnings uppgift

För VG-delen som jag gjorde valde jag att ha anpassa validering & felhantering på:

* PUT /products/:id
* POST /products
* PUT /customers/:id

Extra funktionaliteten jag valde är 2. Sortering av produktlistan med stigande eller sjunkande pris
```js
/products?sort=price_asc/desc
```
