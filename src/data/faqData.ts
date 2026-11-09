/**
 * Centralized FAQ Configuration for SM Studios Selection-Based Chatbot
 * All questions, categories, and verified answers are configured here.
 */

export interface FAQCategory {
  title: string;
  questions: string[];
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    title: 'PRODUCTS',
    questions: [
      'What products do you offer?',
      'What Hindu god idols are available?',
      'What sizes are available?',
      'Can I customize the colour of my figurine?',
    ],
  },
  {
    title: 'CUSTOM 3D PRINTING',
    questions: [
      'What is custom 3D printing?',
      'Can I print my own STL file?',
      'How do I submit a custom printing request?',
      'What file formats do you support?',
    ],
  },
  {
    title: 'PRICING',
    questions: [
      'How is the printing price calculated?',
      'How do custom quotations work?',
      'How can I receive a price estimate?',
    ],
  },
  {
    title: 'ORDERS AND TRACKING',
    questions: [
      'How do I place an order?',
      'How can I track my order?',
      'How do I confirm my quotation?',
    ],
  },
  {
    title: 'PRODUCTION AND DELIVERY',
    questions: [
      'How long does production take?',
      'How does delivery work?',
      'How can I get updates about my order?',
    ],
  },
];

export const WELCOME_MESSAGE = `Namaste! Welcome to SM Studios. 🙏

I'm your SM Studios assistant. I can help you explore our 3D printing products, custom printing services, pricing, orders, and delivery information.

Please select a question below to get started.`;

export const FAQ_ANSWERS: Record<string, string> = {
  // PRODUCTS
  'What products do you offer?':
    'At SM Studios, we specialize in high-precision 3D printing with ultra-fine resolution and zero visible layer lines.\n\nOur catalogue features:\n• Sacred Hindu God Idols: Lord Venkateswara (Tirupati Balaji), Bal Ganesha with Shivling, Goddess Mahalakshmi, and Bal Krishna with Flute.\n• Heritage & Art Figurines: Collectible character sculptures and divine art.\n• On-Demand Custom 3D Printing: Custom print-on-demand from your CAD, 3D sculpts, or image references.\n\nAll pieces are printed in industrial-grade photopolymer resin with hand-applied finishes.',

  'What Hindu god idols are available?':
    'Our sacred god idol collection currently features:\n\n1. Lord Venkateswara (Balaji) – ₹1,499\n   (150mm × 75mm × 65mm, 185g solid core, silk gold finish)\n2. Bal Ganesha with Shivling – ₹999\n   (110mm × 70mm × 70mm, dual-tone gold & black, dashboard-safe)\n3. Goddess Mahalakshmi – ₹1,499\n   (130mm × 90mm × 85mm, pristine white marble SLA resin)\n4. Bal Krishna with Flute – ₹1,199\n   (120mm × 80mm × 75mm, butter matki & bansuri in silk gold)\n\nAll idols come with stable integrated circular display pedestals suitable for home mandirs and car dashboards.',

  'What sizes are available?':
    'Our standard catalogue pieces come in tailored heights:\n• 75mm (Compact / Car Dashboard size)\n• 110mm - 130mm (Standard Home Mandir size)\n• 150mm - 160mm (Altar & Display shelf size)\n• 200mm (Grand Altar edition)\n\nFor custom 3D printing orders, we can scale your 3D models to any exact millimeter dimensions within our build volume.',

  'Can I customize the colour of my figurine?':
    'Yes! We offer multiple premium hand-applied surface finishes:\n• Silk Gold Finish (lustrous metallic sheen)\n• Antique Patina Brass / Bronze (aged temple look)\n• Pristine Pure Marble White (smooth non-porous resin)\n• Hand-Detailed Accents (custom dual-tone highlights)\n\nYou can select your preferred finish directly on the product card or specify custom paint details during checkout.',

  // CUSTOM 3D PRINTING
  'What is custom 3D printing?':
    'Custom 3D printing allows you to bring your own digital designs, prototypes, architectural models, or concept art into physical reality.\n\nWe utilize industrial 8K & 12K photopolymer resin systems that cure liquid resin layer-by-layer at 25 microns (0.025mm), producing glass-smooth surfaces without the rough ridges typical of standard plastic printers.',

  'Can I print my own STL file?':
    'Absolutely! If you already have a 3D model (.STL, .OBJ, or .STEP), you can upload it directly using our "Custom 3D Print" tool.\n\nOur workshop engineers inspect your file for wall thickness, mesh manifold integrity, and slicing orientation before beginning the print.',

  'How do I submit a custom printing request?':
    'Submitting a custom print request is straightforward:\n1. Click "Custom 3D Printing" below or tap "Upload STL Quote" on the storefront.\n2. Choose whether you are uploading an existing 3D file (.STL / .OBJ) or a reference image.\n3. Enter any notes regarding desired scale, finish, or infill density.\n4. Click "Add to Cart" and complete checkout with your WhatsApp number.\n5. Our technicians will inspect the geometry and send your quotation directly to your WhatsApp.',

  'What file formats do you support?':
    'We support the following file formats up to 60MB:\n• 3D Model files: .STL, .OBJ, .STEP, .3MF\n• Image references for 3D conversion: .PNG, .JPG, .JPEG, .WEBP\n\nIf your file is larger than 60MB or in another CAD format, you can share it directly with our team on WhatsApp (9014506060).',

  // PRICING
  'How is the printing price calculated?':
    'Our pricing is transparent and calculated based on:\n1. Resin Volume & Weight: Exact milliliters of photopolymer resin consumed.\n2. Layer Height & Print Time: Machine run-time at ultra-fine 25-micron resolution.\n3. Post-Processing & Finish: Ultrasonic alcohol wash, UV light-curing chamber, and hand-finishing (Silk Gold, Patina, or Marble).\n\nStandard catalogue idols have fixed prices displayed in the shop (e.g., Bal Ganesha at ₹999, Balaji at ₹1,499).',

  'How do custom quotations work?':
    'When you submit a custom 3D print request:\n1. Your request enters our workshop queue with status "Pending Quote".\n2. Our technicians run slicing software to calculate exact resin volume and machine time.\n3. We provide an exact quote in INR and send a notification with an update link directly to your WhatsApp.\n4. You can review the quote and confirm production with one click.',

  'How can I receive a price estimate?':
    'You can receive an instant quotation by uploading your 3D model through our Custom 3D Print section on this website.\n\nAlternatively, send your design file, dimensions, and quantity directly to our WhatsApp support at +91 9014506060, and our team will calculate the estimate for you.',

  // ORDERS AND TRACKING
  'How do I place an order?':
    'To place an order:\n1. Browse our collection and choose your idol or figurine.\n2. Select your desired finish and scale, then click "Add to Cart".\n3. Open your Cart and proceed to Checkout.\n4. Provide your delivery address and valid 10-digit Indian WhatsApp mobile number.\n5. Click "Place Order" to receive your unique Tracking ID (e.g., TH-3D-XXXXXX).',

  'How can I track my order?':
    'You can track your order live at any time:\n1. Click "Track My Order" below or in the top navigation bar.\n2. Enter your unique Order Tracking ID (e.g. TH-3D-689635).\n3. Enter your registered WhatsApp phone number for privacy verification.\n4. View your real-time status: Pending Quote, Quote Sent, Confirmed, In Production, Shipped, or Completed.',

  'How do I confirm my quotation?':
    'Once our workshop provides a quote for your custom 3D job:\n1. You will receive a WhatsApp notification with your quote amount.\n2. Open the "Track My Order" modal and enter your Tracking ID and phone number.\n3. Click the "Confirm Order" button to approve the quote.\n4. Your job will immediately enter our active 3D printing queue.',

  // PRODUCTION AND DELIVERY
  'How long does production take?':
    'Production timelines:\n• In-Stock Sacred Idols: Dispatched within 24 hours.\n• Custom 3D Prints: 48 to 72 hours for precision slicing, resin printing, ultrasonic cleaning, and UV curing.\n• Rush Priority Option (+₹250): Places your order at the top of the print bed queue within 12 hours.',

  'How does delivery work?':
    'Delivery details:\n• Free Pan-India Delivery on all orders above ₹999.\n• Standard delivery fee of ₹99 for orders under ₹999.\n• All shipments are protected with our 100% Zero-Break Guarantee in laser-cut EVA foam packaging.\n• Once dispatched, you receive a courier tracking number for door-to-door delivery updates.',

  'How can I get updates about my order?':
    'You get updates in two easy ways:\n1. Real-time website tracking: Use the "Track My Order" modal anytime with your Tracking ID and phone number.\n2. WhatsApp support: Chat with our workshop desk at +91 9014506060 with your Tracking ID for immediate assistance.',
};
