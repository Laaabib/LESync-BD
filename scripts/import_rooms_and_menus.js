import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:vPTi5KTB4bQm1QlL@db.cvviwipdglcajldmzbvc.supabase.co:5432/postgres';

console.log('Connecting to PostgreSQL to import 110 rooms (1001 to 1110) and restaurant menus...');

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generate 110 rooms from 1001 to 1110
    const rooms = [];
    for (let num = 1001; num <= 1110; num++) {
      const roomNumStr = String(num);
      const floorNum = num <= 1055 ? 10 : 11;
      const wing = floorNum === 10 ? 'Tower Wing - Suites' : 'Tower Wing - Skyline Executive';

      let roomTypeId = 'rt-5';
      let roomTypeName = 'Deluxe Room';
      let rate = 8500;
      let features = ['High-Speed Wi-Fi', 'Balcony', 'Smart TV 50"', 'Mini Bar', 'Air Conditioned'];
      let amenities = ['Queen Bed', 'Walk-in Shower', 'Complimentary Breakfast', 'Mini Fridge'];

      if (num === 1001 || num === 1002 || num === 1109 || num === 1110) {
        roomTypeId = 'rt-1';
        roomTypeName = 'Presidential Suite';
        rate = 28000;
        features = ['Private Butler Service', 'Panoramic Sky View Balcony', 'Jacuzzi', 'Executive Workstation', 'Bang & Olufsen Sound System'];
        amenities = ['Master King Bed', 'Living Lounge', 'Dine-in Bar', 'Walk-in Closet', 'Hermès Toiletries', 'Nespresso Coffee Machine'];
      } else if ((num >= 1003 && num <= 1010) || (num >= 1101 && num <= 1108)) {
        roomTypeId = 'rt-2';
        roomTypeName = 'Royal Suite';
        rate = 18500;
        features = ['Club Lounge Access', 'Private Balcony', 'Living Room', 'Smart TV 55"', 'High-speed Wi-Fi'];
        amenities = ['King Bed', 'Bathtub', 'Plush Robes & Slippers', 'Complimentary High Tea', 'Mini Bar'];
      } else if (num >= 1011 && num <= 1025) {
        roomTypeId = 'rt-3';
        roomTypeName = 'Honeymoon Suite';
        rate = 15000;
        features = ['Romantic Balcony', 'Jacuzzi Bath', 'Mood Lighting', 'Aromatherapy Setup', 'Smart TV 50"'];
        amenities = ['Canopy King Bed', 'Flower Arrangement', 'Complimentary Cake & Wine', 'Breakfast in Bed'];
      } else if (num >= 1026 && num <= 1050) {
        roomTypeId = 'rt-4';
        roomTypeName = 'Family Deluxe';
        rate = 12500;
        features = ['Twin Double Beds', 'Kids Play Corner', 'Pool View Balcony', 'Microwave & Kettle', 'Smart TV 43"'];
        amenities = ['2 Queen Beds', 'Attached Modern Bath', 'Extra Crib Available', 'Tea/Coffee Station'];
      } else if (num >= 1051 && num <= 1085) {
        roomTypeId = 'rt-5';
        roomTypeName = 'Deluxe Room';
        rate = 8500;
        features = ['Balcony', 'City / Lake View', 'Workstation', 'Smart TV 43"', 'High-speed Wi-Fi'];
        amenities = ['Queen Bed', 'Walk-in Shower', 'Complimentary Breakfast', 'Mini Fridge'];
      } else {
        roomTypeId = 'rt-6';
        roomTypeName = 'Standard Room';
        rate = 5500;
        features = ['LED TV', 'Wi-Fi', 'Work Table', 'Air Conditioned'];
        amenities = ['Double Bed', 'Attached Bath', 'Complimentary Breakfast', 'Kettle'];
      }

      let operationalStatus = 'Available';
      let housekeepingStatus = 'Clean';
      let statusLabel = 'Clean & Vacant';

      if (num % 7 === 0) {
        operationalStatus = 'Occupied';
        housekeepingStatus = 'Clean';
        statusLabel = 'Occupied';
      } else if (num % 13 === 0) {
        operationalStatus = 'Reserved';
        housekeepingStatus = 'Clean';
        statusLabel = 'Reserved';
      } else if (num % 23 === 0) {
        operationalStatus = 'Dirty';
        housekeepingStatus = 'Dirty';
        statusLabel = 'Dirty';
      } else if (num % 37 === 0) {
        operationalStatus = 'Cleaning';
        housekeepingStatus = 'Cleaning';
        statusLabel = 'Cleaning in Progress';
      } else if (num % 29 === 0) {
        operationalStatus = 'Inspected';
        housekeepingStatus = 'Inspected';
        statusLabel = 'Inspected & Ready';
      }

      rooms.push({
        id: `rm-${roomNumStr}`,
        roomNumber: roomNumStr,
        roomTypeId,
        roomTypeName,
        floor: floorNum,
        building: 'Main Resort Complex',
        wing,
        rate,
        baseRate: rate,
        isSmoking: false,
        keyCardCode: `KC-${roomNumStr}`,
        features,
        amenities,
        operationalStatus,
        housekeepingStatus,
        statusLabel,
        active: true,
        notes: num === 1001 ? 'VIP Presidential Suite' : undefined,
      });
    }

    console.log(`Generated ${rooms.length} rooms starting with 1001 (1001 to 1110).`);

    // 2. Delete any old obsolete rooms not in 1001..1110
    const validRoomNumbers = rooms.map(r => r.roomNumber);
    const deleteRes = await client.query(
      `DELETE FROM pms_rooms WHERE NOT (room_number = ANY($1::text[]))`,
      [validRoomNumbers]
    );
    console.log(`Pruned ${deleteRes.rowCount} old non-matching rooms from pms_rooms.`);

    // 3. Upsert all 110 rooms into pms_rooms table
    for (const r of rooms) {
      await client.query(
        `INSERT INTO pms_rooms (id, room_number, room_type_name, floor, status, condition, rate, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (room_number) DO UPDATE SET
           room_type_name = EXCLUDED.room_type_name,
           floor = EXCLUDED.floor,
           status = EXCLUDED.status,
           condition = EXCLUDED.condition,
           rate = EXCLUDED.rate,
           updated_at = NOW();`,
        [
          r.id,
          r.roomNumber,
          r.roomTypeName,
          String(r.floor),
          r.statusLabel,
          'Good',
          r.rate,
        ]
      );
    }
    console.log(`Upserted 110 rooms into pms_rooms table successfully.`);

    // 4. Restaurant Categories and Menus
    const menuCategories = [
      { id: 'cat-1', name: 'Traditional Bengali & Royal Feast', active: true },
      { id: 'cat-2', name: 'Grills, Steaks & BBQ', active: true },
      { id: 'cat-3', name: 'Continental & Italian', active: true },
      { id: 'cat-4', name: 'Oriental & Pan-Asian', active: true },
      { id: 'cat-5', name: 'Beverages, Mocktails & Juices', active: true },
      { id: 'cat-6', name: 'Desserts & Sweet Delights', active: true },
      { id: 'cat-7', name: 'Appetizers, Soups & Salads', active: true },
      { id: 'cat-8', name: 'Breakfast & All-Day Dining', active: true },
    ];

    const menuItems = [
      { id: 'mi-1', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Special Mutton Kacchi Biryani', description: 'Traditional aromatic basmati rice cooked with tender mutton cuts, saffron, aloo, and boiled egg. Served with borhani & salad.', price: 650, active: true },
      { id: 'mi-2', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Padma River Hilsha Curry (Mustard/Sorshe)', description: 'Fresh Padma Ilish cooked in pungent mustard gravy with green chillies. Served with steamed rice.', price: 850, active: true },
      { id: 'mi-3', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Bhuna Khichuri with Beef Kala Bhuna', description: 'Moong dal khichuri paired with authentic Chittagong style slow-braised beef kala bhuna.', price: 720, active: true },
      { id: 'mi-4', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Rupchanda Fish Fry with Salad', description: 'Whole marinated Rupchanda shallow fried to golden perfection with lemon and tartar dip.', price: 780, active: true },
      { id: 'mi-13', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Shorshe Chingri Malai Curry', description: 'Jumbo river prawns simmered in fragrant coconut milk and mild mustard gravy.', price: 750, active: true },
      { id: 'mi-14', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Shahi Morog Polao with Boiled Egg', description: 'Traditional country chicken braised in rich ghee, yogurt, fried onions and aromatic chinigura rice.', price: 540, active: true },
      { id: 'mi-15', categoryId: 'cat-1', categoryName: 'Traditional Bengali & Royal Feast', name: 'Chittagong Beef Rezala', description: 'Tender beef cubes slow-simmered in rich cashew, poppy seed, and aromatic whole spice gravy.', price: 580, active: true },

      { id: 'mi-5', categoryId: 'cat-2', categoryName: 'Grills, Steaks & BBQ', name: 'Grilled Jumbo King Prawns (4 Pcs)', description: 'Garlic butter basted jumbo river prawns with sautéed veggies and herb rice.', price: 1250, active: true },
      { id: 'mi-6', categoryId: 'cat-2', categoryName: 'Grills, Steaks & BBQ', name: 'T-Bone Beef Steak (300g)', description: 'Imported prime beef cooked to preference with mushroom peppercorn sauce and mashed potato.', price: 1650, active: true },
      { id: 'mi-7', categoryId: 'cat-2', categoryName: 'Grills, Steaks & BBQ', name: 'Chicken Tikka Butter Masala & Butter Naan', description: 'Charcoal grilled chicken cubes simmered in rich creamy tomato cashew gravy with 2 butter naans.', price: 580, active: true },
      { id: 'mi-16', categoryId: 'cat-2', categoryName: 'Grills, Steaks & BBQ', name: 'Charcoal Grilled Mutton Seekh Kebab (4 Pcs)', description: 'Minced spiced mutton skewer roasted in clay tandoor oven, served with mint chutney and paratha.', price: 620, active: true },
      { id: 'mi-17', categoryId: 'cat-2', categoryName: 'Grills, Steaks & BBQ', name: 'BBQ Grilled Norwegian Salmon Fillet', description: 'Atlantic salmon steak pan-grilled with lemon herb butter sauce, asparagus, and parsley potatoes.', price: 1450, active: true },
      { id: 'mi-18', categoryId: 'cat-2', categoryName: 'Grills, Steaks & BBQ', name: 'Mixed Sizzler Platter (Beef, Chicken & Prawn)', description: 'Sizzling hot platter of beef tenderloin medallions, grilled chicken breast, and king prawns.', price: 1550, active: true },

      { id: 'mi-8', categoryId: 'cat-3', categoryName: 'Continental & Italian', name: 'Fettuccine Alfredo with Grilled Chicken', description: 'Fresh fettuccine pasta tossed in rich parmesan cream sauce with grilled chicken breast slices.', price: 620, active: true },
      { id: 'mi-9', categoryId: 'cat-3', categoryName: 'Continental & Italian', name: 'Wood-Fired Pizza Quattro Formaggi (12")', description: 'Mozzarella, cheddar, gorgonzola, and parmesan on hand-stretched thin crust.', price: 890, active: true },
      { id: 'mi-19', categoryId: 'cat-3', categoryName: 'Continental & Italian', name: 'Classic Pepperoni & Mushroom Pizza (12")', description: 'Hand-tossed dough with San Marzano tomato sauce, beef pepperoni, fresh button mushrooms, and mozzarella.', price: 920, active: true },
      { id: 'mi-20', categoryId: 'cat-3', categoryName: 'Continental & Italian', name: 'Penne Arrabbiata with Garlic Bread', description: 'Al dente penne in spicy tomato-garlic sauce with black olives and extra virgin olive oil.', price: 520, active: true },
      { id: 'mi-21', categoryId: 'cat-3', categoryName: 'Continental & Italian', name: 'Pan-Seared Sea Bass with Lemon Caper Butter', description: 'Delicate white sea bass fillet served with roasted baby potatoes and sautéed baby beans.', price: 1100, active: true },

      { id: 'mi-22', categoryId: 'cat-4', categoryName: 'Oriental & Pan-Asian', name: 'Authentic Thai Tom Yum Goong Soup', description: 'Spicy and sour Thai broth with jumbo prawns, lemongrass, galangal, kaffir lime, and straw mushrooms.', price: 460, active: true },
      { id: 'mi-23', categoryId: 'cat-4', categoryName: 'Oriental & Pan-Asian', name: 'Chicken Pad Thai Rice Noodles', description: 'Wok-tossed flat rice noodles with egg, chicken, bean sprouts, crushed peanuts, and tamarind glaze.', price: 520, active: true },
      { id: 'mi-24', categoryId: 'cat-4', categoryName: 'Oriental & Pan-Asian', name: 'Szechuan Crispy Chili Beef', description: 'Shredded crispy beef strips tossed in fiery Szechuan red chili oil with bell peppers and spring onions.', price: 680, active: true },
      { id: 'mi-25', categoryId: 'cat-4', categoryName: 'Oriental & Pan-Asian', name: 'Dim Sum Steamed Dumpling Basket (6 Pcs)', description: 'Handcrafted chicken and prawn dim sums served with house chili oil and ginger soya dip.', price: 480, active: true },
      { id: 'mi-26', categoryId: 'cat-4', categoryName: 'Oriental & Pan-Asian', name: 'Kung Pao Chicken with Roasted Cashews', description: 'Wok-seared diced chicken with dry red chillies, scallions, and toasted cashews in savory glaze.', price: 560, active: true },

      { id: 'mi-27', categoryId: 'cat-7', categoryName: 'Appetizers, Soups & Salads', name: 'Crispy Calamari Rings with Garlic Aioli', description: 'Golden breaded squid rings seasoned with sea salt and cracked pepper, served with garlic herb aioli.', price: 490, active: true },
      { id: 'mi-28', categoryId: 'cat-7', categoryName: 'Appetizers, Soups & Salads', name: 'Cream of Wild Forest Mushroom Soup', description: 'Velvety puréed button and shiitake mushroom soup infused with truffle oil, served with croutons.', price: 380, active: true },
      { id: 'mi-29', categoryId: 'cat-7', categoryName: 'Appetizers, Soups & Salads', name: 'Caesar Salad with Grilled Chicken Breast', description: 'Crisp romaine lettuce, herb croutons, shaved parmesan, grilled chicken, and classic anchovy-parmesan dressing.', price: 440, active: true },
      { id: 'mi-30', categoryId: 'cat-7', categoryName: 'Appetizers, Soups & Salads', name: 'Spicy Buffalo Chicken Wings (6 Pcs)', description: 'Crispy fried chicken wings tossed in tangy cayenne pepper glaze, served with blue cheese dip and celery sticks.', price: 460, active: true },

      { id: 'mi-31', categoryId: 'cat-8', categoryName: 'Breakfast & All-Day Dining', name: 'CCULB Royal English Breakfast Platter', description: 'Two farm eggs cooked to order, chicken sausages, beef bacon, baked beans, grilled tomato, hash browns, and toasted bread.', price: 550, active: true },
      { id: 'mi-32', categoryId: 'cat-8', categoryName: 'Breakfast & All-Day Dining', name: 'Traditional Paratha, Bhaji & Masala Omelette', description: 'Two layered ghee parathas served with vegetable bhaji, spiced onion-chili omelette, and mango pickle.', price: 280, active: true },
      { id: 'mi-33', categoryId: 'cat-8', categoryName: 'Breakfast & All-Day Dining', name: 'Resort Club Sandwich with French Fries', description: 'Triple-decker toasted white sandwich layered with smoked chicken, cheddar, fried egg, lettuce, and tomatoes.', price: 450, active: true },
      { id: 'mi-34', categoryId: 'cat-8', categoryName: 'Breakfast & All-Day Dining', name: 'Gourmet Angus Beef Burger with Fries', description: 'Charcoal grilled beef patty with aged cheddar, caramelized onions, gherkins, and special sauce in brioche bun.', price: 720, active: true },

      { id: 'mi-12', categoryId: 'cat-6', categoryName: 'Desserts & Sweet Delights', name: 'Matka Kulfi with Pistachio & Saffron', description: 'Slow cooked condensed milk kulfi infused with Kashmiri saffron in traditional clay pot.', price: 220, active: true },
      { id: 'mi-35', categoryId: 'cat-6', categoryName: 'Desserts & Sweet Delights', name: 'Belgian Molten Dark Chocolate Lava Cake', description: 'Warm molten chocolate cake with gooey lava core, accompanied by a scoop of artisanal vanilla ice cream.', price: 350, active: true },
      { id: 'mi-36', categoryId: 'cat-6', categoryName: 'Desserts & Sweet Delights', name: 'New York Baked Cheesecake', description: 'Creamy philadelphia cream cheese cake with graham cracker crust, drizzled with wild strawberry coulis.', price: 340, active: true },
      { id: 'mi-37', categoryId: 'cat-6', categoryName: 'Desserts & Sweet Delights', name: 'Royal Shahi Tukra with Silver Leaf', description: 'Crispy fried bread triangles soaked in saffron cardamom syrup, smothered in thickened rabri and nuts.', price: 220, active: true },

      { id: 'mi-10', categoryId: 'cat-5', categoryName: 'Beverages, Mocktails & Juices', name: 'Fresh Mint Lemonade', description: 'Freshly squeezed lemon, organic garden mint, rock salt, and crushed ice.', price: 180, active: true },
      { id: 'mi-11', categoryId: 'cat-5', categoryName: 'Beverages, Mocktails & Juices', name: 'Royal Saffron Borhani (Glass)', description: 'Traditional yogurt drink spiced with mustard seeds, mint, roasted cumin, and black salt.', price: 150, active: true },
      { id: 'mi-38', categoryId: 'cat-5', categoryName: 'Beverages, Mocktails & Juices', name: 'Tropical Blue Lagoon Mocktail', description: 'Refreshing sparkling cooler with blue curaçao, fresh lime juice, sprite, and mint leaves.', price: 240, active: true },
      { id: 'mi-39', categoryId: 'cat-5', categoryName: 'Beverages, Mocktails & Juices', name: 'Virgin Mojito with Crushed Ice', description: 'Muddled fresh lime wedges, mint sprigs, pure cane sugar syrup, topped with effervescent club soda.', price: 220, active: true },
      { id: 'mi-40', categoryId: 'cat-5', categoryName: 'Beverages, Mocktails & Juices', name: 'Artisan Espresso / Cappuccino Roast', description: 'Freshly ground arabica beans double shot, frothed with silky whole milk and cinnamon dust.', price: 210, active: true },
      { id: 'mi-41', categoryId: 'cat-5', categoryName: 'Beverages, Mocktails & Juices', name: 'Fresh Green Coconut Water (Daab)', description: 'Naturally chilled sweet electrolyte water directly from freshly sliced organic coconut.', price: 120, active: true },
    ];

    console.log(`Generated ${menuCategories.length} menu categories and ${menuItems.length} menu items.`);

    // 5. Build full PMS snapshot state
    const roomTypes = [
      { id: 'rt-1', name: 'Presidential Suite', description: 'Ultra-luxurious top-floor suite with private infinity view balcony, master lounge, jacuzzi, and butler service.', maxAdults: 4, maxChildren: 2, baseRate: 28000, extraAdultRate: 3500, extraChildRate: 2000, amenities: ['King Bed', 'Private Jacuzzi', 'Lounge Area', 'River View', 'Smart TV 65"', 'High-speed Wi-Fi', 'Complimentary Breakfast', 'Butler Service', 'Espresso Machine'], active: true, totalRooms: 4 },
      { id: 'rt-2', name: 'Royal Suite', description: 'Opulent suite featuring master bedroom, living hall, modern bath amenities, and panoramic resort garden views.', maxAdults: 3, maxChildren: 2, baseRate: 18500, extraAdultRate: 2500, extraChildRate: 1500, amenities: ['King Bed', 'Bathtub', 'Living Area', 'Garden View', 'Smart TV 55"', 'High-speed Wi-Fi', 'Complimentary Breakfast', 'Mini Fridge'], active: true, totalRooms: 16 },
      { id: 'rt-3', name: 'Honeymoon Suite', description: 'Specially decorated romantic suite with king-size canopy bed, mood lighting, aromatherapy setup, and romantic balcony.', maxAdults: 2, maxChildren: 1, baseRate: 15000, extraAdultRate: 2500, extraChildRate: 1200, amenities: ['Canopy King Bed', 'Jacuzzi Bath', 'Balcony', 'Romantic Decor', 'Flower Setup', 'Smart TV', 'Wi-Fi', 'Breakfast in Bed'], active: true, totalRooms: 15 },
      { id: 'rt-4', name: 'Family Deluxe', description: 'Spacious interconnected or twin double bedrooms designed for family comfort with kids play-corner setup.', maxAdults: 4, maxChildren: 3, baseRate: 12500, extraAdultRate: 2000, extraChildRate: 1000, amenities: ['2 Queen Beds', 'Attached Bathroom', 'Balcony', 'Smart TV 43"', 'Wi-Fi', 'Complimentary Breakfast', 'Tea/Coffee Maker'], active: true, totalRooms: 25 },
      { id: 'rt-5', name: 'Deluxe Room', description: 'Elegantly furnished premium room with private balcony, workstation, and serene swimming pool view.', maxAdults: 2, maxChildren: 1, baseRate: 8500, extraAdultRate: 1800, extraChildRate: 900, amenities: ['Queen Bed', 'Pool View Balcony', 'Modern Bath', 'Workstation', 'Smart TV', 'Wi-Fi', 'Complimentary Breakfast'], active: true, totalRooms: 35 },
      { id: 'rt-6', name: 'Standard Room', description: 'Cozy and well-appointed room for business and budget travelers equipped with essential modern comforts.', maxAdults: 2, maxChildren: 1, baseRate: 5500, extraAdultRate: 1500, extraChildRate: 800, amenities: ['Double Bed', 'Attached Bath', 'LED TV', 'Wi-Fi', 'Work Table', 'Complimentary Breakfast'], active: true, totalRooms: 15 },
    ];

    const floors = [
      { id: 'fl-10', floorNumber: 10, name: '10th Floor - Tower Wing Suites', code: 'FL-10', building: 'Main Resort Complex', wing: 'Tower Wing', keyCardPrefix: 'KC-10', isSmokingAllowed: false, active: true, description: 'Suites and Deluxe rooms from 1001 to 1055' },
      { id: 'fl-11', floorNumber: 11, name: '11th Floor - Skyline Executive', code: 'FL-11', building: 'Main Resort Complex', wing: 'Tower Wing', keyCardPrefix: 'KC-11', isSmokingAllowed: false, active: true, description: 'Executive Suites and Rooms from 1056 to 1110' },
    ];

    const users = [
      { id: 'usr-admin-1', name: 'Engr. Subrata Roy', email: 'admin@lesyncpms.com', role: 'Super Admin', department: 'Executive Management', active: true, phone: '+880 1711-000001', createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    const fullSnapshotPayload = {
      resortName: 'Heritage Resort & Spa',
      businessDate: new Date().toISOString().slice(0, 10),
      users,
      rooms,
      roomTypes,
      floors,
      menuCategories,
      menuItems,
      reservations: [],
      stays: [],
      folios: [],
      payments: [],
      invoices: [],
      eventBookings: [],
      lastImportedAt: new Date().toISOString(),
    };

    // 6. Upsert pms_snapshots
    await client.query(
      `INSERT INTO pms_snapshots (snapshot_key, resort_name, business_date, state_payload, version, synced_by, total_entities, last_synced_at)
       VALUES ('current_pms_state', $1, $2, $3::jsonb, 2, 'data-importer', $4, NOW())
       ON CONFLICT (snapshot_key) DO UPDATE SET
         resort_name = EXCLUDED.resort_name,
         business_date = EXCLUDED.business_date,
         state_payload = EXCLUDED.state_payload,
         version = pms_snapshots.version + 1,
         synced_by = EXCLUDED.synced_by,
         total_entities = EXCLUDED.total_entities,
         last_synced_at = NOW();`,
      [
        fullSnapshotPayload.resortName,
        fullSnapshotPayload.businessDate,
        JSON.stringify(fullSnapshotPayload),
        rooms.length + menuItems.length + roomTypes.length,
      ]
    );

    console.log(`Saved comprehensive snapshot into pms_snapshots with ${rooms.length} rooms and ${menuItems.length} menu items.`);

    await client.query('COMMIT');
    console.log('ALL IMPORT TRANSACTIONS COMMITTED SUCCESSFULLY!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal error in import script:', err);
  process.exit(1);
});
