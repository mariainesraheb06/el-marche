// Which products share which photos. Each group needs between 1 and "want" photos.
// Files go in scripts/seed/photos and are named <group>-1.jpg, <group>-2.jpg, ...
// "search" is the English search to type on Pexels, Unsplash or Pixabay.
// The 18 products that use the team's own photos are not listed here.

export const GROUPS = {
  // Mode et accessoires
  joggers: { search: "baggy jogger pants", want: 3, products: ["Jogger baggy en coton noir", "Jogger baggy vert militaire", "Jogger baggy gris chiné", "Jogger cargo beige multi-poches"] },
  sneakers: { search: "white sneakers", want: 3, products: ["Sneakers blanches style rétro", "Sneakers montantes jaune et noir", "Sneakers montantes en toile blanche"] },
  "running-shoes": { search: "running shoes", products: ["Baskets running légères", "Chaussures de running légères"] },
  "denim-jacket": { search: "denim jacket", products: ["Veste en jean oversize"] },
  hoodie: { search: "burgundy hoodie", products: ["Hoodie oversize gris anthracite"] },
  cap: { search: "black snapback cap", products: ["Casquette snapback noire"] },
  backpack: { search: "black backpack", products: ["Sac à dos urbain imperméable"] },
  handbag: { search: "leather handbag", products: ["Sac à main en cuir synthétique", "Sac à main bordeaux à double anse"] },
  "tuareg-scarf": { search: "blue cotton scarf", products: ["Chèche en coton bleu touareg"] },
  sunglasses: { search: "retro sunglasses", products: ["Lunettes de soleil rétro"] },

  // Beauté et soins
  "dropper-oil": { search: "dropper oil bottle", want: 3, products: ["Huile de nigelle pressée à froid 100 ml", "Huile de figue de barbarie 30 ml", "Huile de ricin pour cheveux et cils 100 ml"] },
  "rose-water": { search: "rose water bottle", products: ["Eau de rose de Blida 250 ml", "Eau de fleur d'oranger 250 ml"] },
  "body-care": { search: "natural body scrub jar", want: 3, products: ["Savon noir traditionnel pour hammam", "Beurre de karité pur 200 g", "Gommage au café et au miel"] },
  "face-care": { search: "face mask skincare", products: ["Gel nettoyant visage purifiant 200 ml", "Coffret soin visage à la rose de Blida"] },
  "olive-oil": { search: "olive oil bottle", want: 3, products: ["Huile d'olive de Kabylie pour la peau", "Huile d'olive vierge de Kabylie 1 L", "Olives noires de Kabylie 1 kg"] },
  "henna-kohl": { search: "henna powder", products: ["Henné naturel de Ghardaïa 100 g", "Kohol traditionnel en poudre"] },
  perfume: { search: "perfume bottle", products: ["Parfum oriental au musc blanc 50 ml"] },
  shampoo: { search: "shampoo bottle", products: ["Shampoing à l'ortie 300 ml"] },
  "manicure-set": { search: "manicure set", products: ["Coffret de 6 vernis à ongles"] },

  // Maison, déco et artisanat
  cups: { search: "ceramic coffee cups", products: ["Set de 6 tasses à café en céramique"] },
  copper: { search: "copper tray", want: 4, products: ["Service à thé en cuivre martelé", "Plateau de service en cuivre gravé", "Plateau en cuivre gravé de Constantine", "Théière en cuivre martelé", "Service à thé oriental en laiton"] },
  pottery: { search: "handmade clay pottery", want: 3, products: ["Vase en argile cuite fait main", "Poterie de Maatkas, grand plat décoré"] },
  "textiles-home": { search: "wool cushion blanket", want: 3, products: ["Coussin en laine tissée 45 x 45", "Plaid en laine de montagne", "Jeté de lit rayé noir et blanc"] },
  "candles-incense": { search: "scented candles", want: 3, products: ["Bougies parfumées à la vanille (lot de 3)", "Diffuseur de parfum à bâtonnets et bougies", "Bougies en pot de verre (lot de 6)"] },
  "wall-decor": { search: "wall decor mirror frame", want: 4, products: ["Miroir rond cadre en bois d'olivier", "Cadre photo en bois sculpté", "Miroir mural ornementé bleu", "Console d'entrée blanche sculptée"] },
  baskets: { search: "wicker basket", want: 4, products: ["Panier de rangement en osier", "Panier en osier tressé à la main", "Couffin en feuilles de palmier", "Corbeille à pain en alfa"] },
  rugs: { search: "berber rug", want: 3, products: ["Tapis de salon berbère 160 x 230", "Tapis kabyle tissé main", "Tapis de Ghardaïa en laine"] },
  "wood-crafts": { search: "olive wood handmade", want: 3, products: ["Tabouret en bois d'olivier", "Planche à découper en olivier", "Sculpture berbère en bois"] },
  "engraved-wood": { search: "engraved wood sign", products: ["Enseigne en bois sculpté personnalisable", "Plaque en bois gravée sur mesure"] },
  "traditional-clothing": { search: "traditional embroidered clothing", want: 4, products: ["Burnous traditionnel en laine", "Karakou algérois brodé au fil d'or", "Veste en velours brodée bleu nuit", "Tenue karakou pour fillette", "Gandoura enfant brodée"] },

  // Électronique
  earphones: { search: "wireless earbuds headphones", products: ["Écouteurs Bluetooth sans fil", "Écouteurs à réduction de bruit"] },
  charging: { search: "phone charger power bank", want: 3, products: ["Chargeur rapide 65 W USB-C", "Powerbank 20 000 mAh", "Câble USB-C tressé 2 m (lot de 2)"] },
  smartwatch: { search: "smartwatch", products: ["Montre connectée sport étanche"] },
  speaker: { search: "portable bluetooth speaker", products: ["Enceinte Bluetooth portable"] },
  "pc-accessories": { search: "computer keyboard mouse", want: 3, products: ["Clavier mécanique rétroéclairé", "Souris sans fil ergonomique", "Pack clavier et souris sans fil blancs"] },
  "car-phone-holder": { search: "car phone holder", products: ["Support téléphone pour voiture"] },
  "desk-gadgets": { search: "desk lamp", products: ["Lampe de bureau LED pliable", "Lampe de bureau articulée dorée"] },
  storage: { search: "external ssd usb drive", products: ["Disque SSD externe 1 To", "SSD portable robuste 500 Go"] },
  router: { search: "wifi router", products: ["Routeur Wi-Fi 6 double bande"] },

  // Sports et loisirs
  balls: { search: "soccer ball basketball", products: ["Ballon de football taille 5", "Ballon de basket taille 7"] },
  jersey: { search: "green football jersey", products: ["Maillot de l'Algérie édition fan"] },
  fitness: { search: "fitness equipment", want: 4, products: ["Rameur d'appartement pliable", "Haltères réglables 2 x 10 kg", "Corde à sauter professionnelle", "Bandes de résistance (lot de 5)", "Sangles de suspension d'entraînement"] },
  boxing: { search: "boxing gloves", products: ["Gants de boxe 12 oz"] },
  outdoor: { search: "camping gear", want: 3, products: ["Tente de camping 2 places", "Sac de couchage grand froid", "Table et chaises de camping pliantes"] },
  padel: { search: "padel racket", products: ["Raquette de padel en carbone"] },
  "board-games": { search: "wooden chess set", products: ["Jeu d'échecs en bois", "Échiquier moderne noir et argent"] },
  bike: { search: "mountain bike", products: ["Vélo VTT 26 pouces"] },

  // Enfants et bébé (photos of the products only, no children)
  "baby-clothes": { search: "baby clothes flat lay", want: 4, products: ["Body bébé en coton bio (lot de 3)", "Pyjama enfant en coton", "Ensemble bébé rayé noir et blanc", "Robe bébé en dentelle pour les fêtes"] },
  toys: { search: "kids toys", want: 4, products: ["Camions de chantier en plastique (lot de 3)", "Cubes en bois colorés d'éveil", "Jeu de construction 500 pièces", "Jouets d'éveil en lot : peluches et camions"] },
  "strollers-seats": { search: "baby stroller", products: ["Poussette canne pliable", "Poussette landau 3 en 1"] },
  "night-light": { search: "night light star projector", products: ["Veilleuse lumineuse étoiles"] },
  school: { search: "school supplies", want: 3, products: ["Surligneurs et notes repositionnables", "Crayons de papier et gommes (boîte de 24)", "Trombones colorés (boîte de 200)"] },

  // Alimentation
  dates: { search: "dates fruit", products: ["Dattes Deglet Nour bio 1 kg", "Dattes Mech-Degla 2 kg"] },
  "honey-jam": { search: "honey jar", want: 3, products: ["Miel de montagne de Kabylie 500 g", "Miel de jujubier 500 g", "Confiture de figues artisanale 400 g"] },
  "nuts-fruits": { search: "dried figs almonds", products: ["Figues séchées de Beni Maouche 1 kg", "Amandes grillées 500 g"] },
  couscous: { search: "couscous", products: ["Couscous roulé à la main 2 kg"] },
  spices: { search: "spices jars", want: 3, products: ["Ras el hanout maison 100 g", "Zaatar du Djurdjura 100 g", "Boîte à épices en bois"] },
  "tea-coffee": { search: "mint tea coffee", products: ["Thé vert à la menthe séchée 250 g", "Café moulu à la cardamome 250 g"] },
  pastries: { search: "baklava pastry", products: ["Baklawa à la pistache (boîte de 12)", "Baklawa de Constantine 500 g"] },

  // Bijoux
  "silver-jewelry": { search: "silver jewelry", want: 5, products: ["Collier pendentif cœur en argent", "Parure ajourée en argent (collier et boucles)", "Boucles d'oreilles pendantes en argent", "Collier de perles fines en argent", "Collier ciselé style ancien en argent", "Chaîne fine en argent à pendentif", "Parure de soirée en argent ajouré", "Boucles d'oreilles longues en argent", "Collier ras de cou en argent"] },
  "bridal-jewelry": { search: "coral necklace", want: 3, products: ["Parure de mariage en argent", "Collier de corail rouge", "Parure de fête en perles et argent"] },
  "gold-jewelry": { search: "gold jewelry", products: ["Chaîne en or 18 carats", "Bague en or 18 carats ciselée"] },
  watch: { search: "men wrist watch", products: ["Montre homme bracelet acier"] },
  "bead-bracelet": { search: "beaded leather bracelet", products: ["Bracelet en cuir et perles"] },

  // Autre
  stationery: { search: "notebook pen", want: 3, products: ["Carnet en cuir fait main", "Stylo plume gravé personnalisable", "Agenda 2027 à couverture rigide"] },
  "leather-goods": { search: "leather keychain", products: ["Porte-clés en cuir gravé", "Étui à lunettes en cuir"] },
  plants: { search: "indoor plant", products: ["Ficus en pot pour l'intérieur", "Sansevieria en pot"] },
  gifts: { search: "gift box", products: ["Coffret cadeau surprise"] },
  umbrella: { search: "umbrella", products: ["Parapluie pliable renforcé"] },
  "prayer-mat": { search: "prayer mat", products: ["Tapis de prière rembourré"] },
};