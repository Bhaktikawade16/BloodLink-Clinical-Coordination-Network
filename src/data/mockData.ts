import { BloodCamp, VerifiedBloodBank, ClinicalNotification } from '../types';

export const ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida/AEtjO1WXf0W9kqMWLjbbr78jDLke5aXlGybkUxMhxYcUvWQI-Jl5ZUgTXZ_xVHyV4sKrn_Q170O5yDja9f3v4ozDH_P4yINRrJHQ5-55MpkHyCH0bQkbM7n_IUi4ts41V0XO0y0s0Yu68v9ZeTbSPwNTs4409iJaDx-_3lew6Aks8rW_mmTh8hHsusaOEpVKR_2i7MPsxKslk4W7KhfGc_PMafK7yFse4gDVWvHZh4GJHslHtoVBwCYTp-4GPd0',
  donorCard: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJn-5gw2EiJOSDMQRAN-jjArv8AVYMKu8o9rUk_7tYkJJgsiFpfSz7SVs7-_KFI1zFe1NGgzg6NoBguGUstDUuVM2Q8iIKuQCsCGo5gMD5Caw41m1Nt9Tv-rDa4m7K2Ho9sr07JPxw8H20vkskHLzzpl4O1CJLL4rnqxDqtORMApFriJ3Cv5Y7ddZgKhiI-EdphLHwkXjxVFDhc2h7z6jGvF6M9___rEx_KuyPsX65IYdswma_hRCG',
  hospitalCard: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbbIh9V3nm2Co-c4_h87I6Hz-VProMVy_AKREIeWGUEfmtHcPyriWVo7UYmTDPJdu6_q7B7LSNXwrjpJXyUWMRbh6OKgBtHgUqdkHxl1MG7Ux5cUBKqcyqnfZli5z5BZxA6vlhw4z59ucsaG2m4LNabsHhd9rgy3T9FDHxV_2L-TsFToCjsQHKXNY1nH27scbj43oUtF1eJsEMwbhHInugrJLStXP-1_pEZqE3OeRsWlDNOLfZdowF',
  bloodBankCard: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSJ5XjnnvAwmgXgEP8TX4KtSM7Fon1EDhwvb5dLcfyrqSJQWmgmGKKpNIxPQSMTG29qMeMPt327AEGR1V5Z3bBlJVVBQm_c4QpaKBgiINkO3ptY3zqiYJhi4jqa0M8nC0CRsrNMALvoSDVN7FtfoHIAAFqd1w7GqtdtKNbCAimpsH5CpvPgjXKACGiUujxMLu6E0JNHq-ry8CMM_U050oMkven0DiJ9SE6-6U9KBKWtKhdhgrgsKww',
  bloodCampCard: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxIC4Jtta7ueu5UJeuhtE_6inBq--eheX1pw7olnpRgpvc2X_-qZzHyoYc3LMG9XYYKiDMNRAyDJdiKzz3cECaPZ8653Q3WzcGVjXff3z1oSKWR12AVSf8aBzKV3fOoh_5QSFRuZzq5CtMKis4-Cb8O_v_l11RIoXD075tEs9paxPOEiRCDzlUDSW6i4L74GvYGoYYT9hQsK5YGwZ1WkGLLtXPgPryQeeQQo5Af2Z4W1ks3usY1B4A',
  hospitalOps: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoqMd9Neum-82y53l1k42MSuYNnbWokwivjpeFpUh-Ncqd9wcc_W96GcnkzCaJRYT9POIDlkyxRqSEon5zq0g2JUjiWvZXkwu6AFCkxzbZqrYFkbcqAf6wpal8QkQDV09dXb-cnaO-EdBxB8nAcM5ZA2AJIGW1gCJE5HZeqN3rBIbGfUEpFqhKkU9R0cRZr5nrY41DCSsnimlanuo5zz2kLbnyyXgwVKCaXmgW1zhneShSBn9SeTV8',
  bloodBankLab: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKYQqTCLXZ_3XIWKIfwponWQY-Q7fudDki8Zvto47w1FTXFq0Yw7Qq2I-ndtOlXEKboKT472R9AHAJ6WbJLnsIomjB_BbV9B0B-EuNa4iWWACPkInz3_r-tDNov5il6gxtPgdPsriAmzWjTyQf6rt0iN2eO7TY4JeVASMx81dOryX1lsNdaiqfuLDAfAxjC2nuIOcuKkmwlLLv35PtiNJKR3erHQnbfzzfM6sborYtnWmmCSd19x_7',
  bloodCampDay: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAutkR8waOYucUfmQr0-6EDLE8YbuZ67MGlNAm_mgkSYlWsi6QBSnjf4YeCHx84MEfPqRnnF5PjSEF6s95zxlxs4fQe-4QD6ecNMt6_iZIhxj6ysxlCeNyGygwkTm8NJnyow8dDeiA30nunUY_rRiQzWvVea7aWwppjQQvGq9_qdOSoGbstIgexCwrOxtek4jBh6kbuQGLsj5ErmMeCfWzta5VwXg4ppwe5oJO3mvZZTmJXMB9GIeyi',
  minneapolisMap: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5nGqPxWt96_RnWKYWKwgWQsK_FYNrWm9s9WUw_94Z0irNXlKdQq4xZQ9rtAIeQUvwM6yAyJQ2MXxgBPmQwftu4awY-qMRpuhtGgLfl4gdW4smMjqDzpNVsPRfxPbErLlU5rXsftIm5Y8dnvdGItvcFmO-TYuual5sCtH8LPKo6KqRr4jWqDoaKM3tlT3qnWsW_X-suVAYvR72JRqBc39VUKeLVpmyY4G79fU8SNiddqXfF1vKL9yX'
};

export interface CampPerk {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  value: string;
  image: string;
  description: string;
  tag: string;
}

export const CAMP_PERKS_CATALOG: CampPerk[] = [
  {
    id: 'perk-snack-box',
    title: 'Gourmet Nutrition & Recovery Box',
    subtitle: 'High-Protein Fresh Fruit & Energy Kit',
    category: 'Nutrition',
    value: '$18 Value',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    description: 'Post-donation energy replenishment pack with organic fresh fruits, premium protein oat bars, cold hydration electrolyte beverage, and artisan dark chocolate cookies.',
    tag: 'Free for All Donors'
  },
  {
    id: 'perk-tshirt',
    title: 'Exclusive "LifeSaver Hero" Dri-Fit Tee',
    subtitle: 'Breathable Commemorative Apparel',
    category: 'Merchandise',
    value: '$28 Value',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    description: 'Limited edition athletic performance dri-fit t-shirt with official embroidered BloodLink LifeSaver insignia and commemorative donation milestone badge.',
    tag: 'Limited Edition'
  },
  {
    id: 'perk-health-check',
    title: 'Free 5-Point Comprehensive Health Check',
    subtitle: 'On-Site Vitals, CBC & Hemoglobin Report',
    category: 'Medical',
    value: '$65 Value',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    description: 'Complimentary clinical screening by licensed physicians: Digital Hemoglobin (Hb) levels, Blood Pressure, Pulse Rate, BMI analysis, and immediate take-home medical report.',
    tag: 'Complimentary Checkup'
  },
  {
    id: 'perk-certificate',
    title: 'Certified LifeSaver Certificate & Digital Badge',
    subtitle: 'Government & Red Cross Recognized',
    category: 'Recognition',
    value: 'Priceless',
    image: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
    description: 'Personalized embossed Certificate of Honor recognizing your altruistic gift, plus a verified digital verifiable QR badge to share on LinkedIn and professional profiles.',
    tag: 'Official Honor'
  },
  {
    id: 'perk-donor-card',
    title: 'Smart Donor Blood Group ID Card',
    subtitle: 'Laminated Wallet Card with QR Medical Tag',
    category: 'ID & Safety',
    value: '$15 Value',
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=600&q=80',
    description: 'Durable laminated wallet card displaying your verified blood group, emergency contact details, and secure emergency medical rescue QR link.',
    tag: 'Essential Safety'
  },
  {
    id: 'perk-voucher',
    title: '$15 Health & Wellness Partner Voucher',
    subtitle: 'Redeemable at Organic Cafes & Pharmacies',
    category: 'Voucher',
    value: '$15 Cash Off',
    image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&q=80',
    description: 'Instant discount voucher valid at Apollo Pharmacy, Nature Basket, and organic juice bars across the city as a community appreciation token.',
    tag: 'Community Perk'
  }
];

export const AUTHENTIC_DONATION_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80',
    caption: 'Comfortable air-conditioned recliner stations with compassionate nursing staff.',
    tag: 'Comfort & Care'
  },
  {
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1000&q=80',
    caption: '100% sterile single-use vacutainer systems adhering to WHO safety standards.',
    tag: 'Clinical Safety'
  },
  {
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
    caption: 'Friendly phlebotomists ensuring a completely painless, soothing 10-minute donation.',
    tag: 'Painless Process'
  },
  {
    url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1000&q=80',
    caption: 'Happy voluntary donors proudly holding life-saver honor badges & gift bags.',
    tag: 'Hero Community'
  },
  {
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    caption: 'Modern hospital blood donation suite with free refreshments and hydration bar.',
    tag: 'Modern Facility'
  }
];

export const INITIAL_CAMPS: BloodCamp[] = [
  {
    id: 'CAMP-1',
    name: 'Sahyadri Mega Community Blood Drive & Health Carnival',
    date: '2026-09-15',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    venue: 'FC Road Community Hall',
    address: 'FC Road, Shivaji Nagar, Pune, Maharashtra 411005',
    city: 'Pune',
    contact: '+91 98900 11223',
    registrationLimit: 120,
    registeredCount: 38,
    description: 'Annual mega voluntary blood donation drive organized in partnership with Sahyadri Blood Centre. Features a full air-conditioned reclining lounge, complimentary 5-in-1 health screenings, free high-protein gourmet snack boxes, and exclusive LifeSaver athletic dri-fit tees for all participants.',
    status: 'Active Booking',
    distance: '1.8 km away',
    partnerBloodBank: 'Sahyadri Blood Bank',
    image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1000&q=80'
    ],
    perks: [
      '🎁 Free Gourmet Nutrition & Fresh Fruit Box',
      '👕 Exclusive "LifeSaver Hero" Dri-Fit Athletic Tee',
      '🩺 Free 5-Point Full Health & Hemoglobin Check ($65 Value)',
      '🏅 Red Cross Certified Certificate of Honor & Digital Badge',
      '💳 Personalized Smart Blood Group ID Card',
      '🎟️ $15 Partner Wellness Voucher'
    ],
    highlights: [
      '❄️ Air-Conditioned Deluxe Reclining Beds',
      '☕ Unlimited Fresh Juice & Cookie Lounge',
      '👨‍⚕️ Senior Medical Team from Sahyadri Hospital',
      '⚡ Express 15-Minute Safe Donation'
    ],
    specialBadge: '🔥 Most Popular Drive'
  },
  {
    id: 'CAMP-2',
    name: 'Ruby Hall Trauma Emergency LifeSaver Camp',
    date: '2026-09-18',
    startTime: '08:30 AM',
    endTime: '04:30 PM',
    venue: 'Ruby Hall Medical Auditorium & Lounge',
    address: '40 Sassoon Road, Sangamvadi, Pune, Maharashtra 411001',
    city: 'Pune',
    contact: '+91 20 6645 5100',
    registrationLimit: 85,
    registeredCount: 29,
    description: 'Emergency clinical reserves replenishment camp for acute ICU and trauma surgery patients. Every donor receives an on-the-spot comprehensive hemoglobin report, premium post-donation care hampers, commemorative donor medals, and verified blood donor credits.',
    status: 'Active Booking',
    distance: '3.4 km away',
    partnerBloodBank: 'Ruby Hall Blood Centre',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=80'
    ],
    perks: [
      '🎁 Trauma Hero Nutrition Gift Hamper',
      '👕 Ruby Hall Commemorative Athletic Tee',
      '🩺 Free Complete Blood Count (CBC) & Physician Consult',
      '🏅 Hospital Board Certificate of Life-Saving Merit',
      '🎟️ 20% Discount Card for Family Health Checkups'
    ],
    highlights: [
      '🏥 Direct Hospital ICU & Emergency Trauma Impact',
      '🩺 Complete On-Site Physician Consult',
      '❄️ State-of-the-art Clinical Comfort Suites',
      '🚗 Free Valet Parking for Registered Donors'
    ],
    specialBadge: '🚨 Critical Need Drive'
  },
  {
    id: 'CAMP-3',
    name: 'Kothrud Youth & Tech Park Voluntary Blood Drive',
    date: '2026-09-22',
    startTime: '10:00 AM',
    endTime: '06:00 PM',
    venue: 'City Pride Cultural Complex & Open Plaza',
    address: 'Paschimanagari, Kothrud, Pune, Maharashtra 411038',
    city: 'Pune',
    contact: '+91 94220 55441',
    registrationLimit: 150,
    registeredCount: 54,
    description: 'Vibrant community drive with live acoustic music, hydration smoothie bar, free donor swag bags, and digital photo booth with LifeSaver badges. Partnered with Red Cross Blood Centre.',
    status: 'Active Booking',
    distance: '4.2 km away',
    partnerBloodBank: 'Red Cross Blood Centre',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1000&q=80'
    ],
    perks: [
      '🎁 Deluxe High-Energy Donor Snack Bag & Cold Brew Coffee',
      '👕 Limited Edition Youth LifeSaver Graphic Tee',
      '🩺 Free Blood Pressure, Pulse & Hemoglobin Health Profile',
      '📸 Instant Printed & Digital LifeSaver Photo Frame',
      '🎟️ $15 Partner Cafe & Book voucher'
    ],
    highlights: [
      '🎵 Relaxing Acoustic Ambient Music in Recovery Lounge',
      '☕ Cold Brew, Protein Shakes & Fresh Smoothies',
      '📱 Instant QR Certificate to Share on Social Media',
      '🎁 Exciting Goodie Bag for Every Donor'
    ],
    specialBadge: '⭐ Weekend Special'
  }
];

export const INITIAL_BLOOD_BANKS: VerifiedBloodBank[] = [];

export const INITIAL_NOTIFICATIONS: ClinicalNotification[] = [];

