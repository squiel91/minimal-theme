// Native modules resolve through the versioned import map in routes/+layout.liquid.
import { initMenu } from '@minimal/menu'
import { initCart } from '@minimal/cart'
import { initShopper } from '@minimal/shopper'
import { initForms } from '@minimal/forms'
import { initCatalog } from '@minimal/catalog'
import { initProductPage } from '@minimal/product'

initMenu()
initCart()
initShopper()
initForms()
initCatalog()
initProductPage()
