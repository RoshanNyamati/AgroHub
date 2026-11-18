export type LanguageCode = 'en' | 'kn' | 'hi';

export interface Translations {
  brand: string;
  nav: {
    overview: string;
    machinery: string;
    plots: string;
    dispatch: string;
    myBookings: string;
    bookMachine: string;
    addEquipment: string;
    mobileHome: string;
    mobileFleet: string;
    mobilePlots: string;
    mobileSchedule: string;
  };
  toolbar: {
    view: string;
    roleAll: string;
    roleFarmer: string;
    roleOwner: string;
    searchPlaceholder: string;
    searchLabel: string;
    darkGlass: string;
    sunlightMode: string;
    languageLabel: string;
    signOut: string;
  };
  login: {
    kicker: string;
    showcaseTitle: string;
    showcaseSubtitle: string;
    farmerFeatureTitle: string;
    farmerFeatureSub: string;
    ownerFeatureTitle: string;
    ownerFeatureSub: string;
    title: string;
    subtitle: string;
    roleLabel: string;
    farmerOption: string;
    farmerHint: string;
    ownerOption: string;
    ownerHint: string;
    signInTab: string;
    registerTab: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitFarmer: string;
    submitOwner: string;
    registerFarmer: string;
    registerOwner: string;
    orDivider: string;
    googleBtn: string;
    demoFillLabel: string;
    demoCredentialsHint: string;
    signingIn: string;
  };
  overview: {
    kickerAll: string;
    kickerFarmer: string;
    kickerOwner: string;
    heroTitle: string;
    heroSubtitle: string;
    farmerHeroTitle: string;
    farmerHeroSubtitle: string;
    ownerHeroTitle: string;
    ownerHeroSubtitle: string;
    bookMachinery: string;
    managePlots: string;
    optimizeRoute: string;
    optimizing: string;
    liveFieldCoverage: string;
    readyMachinery: string;
    readySub: string;
    scheduledCoverage: string;
    activePlots: string;
    activePlotsSub: string;
    myBookingsCount: string;
    myBookingsCountSub: string;
    scheduledRevenue: string;
    revenueSub: string;
    pendingApprovals: string;
    pendingSub: string;
    transitSaved: string;
    transitSubOptimized: string;
    transitSubDefault: string;
    mapTitle: string;
    mapSubtitle: string;
    priorityQueueTitle: string;
    priorityQueueSub: string;
    myBookingsTitle: string;
    myBookingsSub: string;
    fullSchedule: string;
    accept: string;
    reject: string;
    inspectRecovery: string;
    allProcessed: string;
    requestMachine: string;
  };
  machinery: {
    title: string;
    subtitle: string;
    ownerSubtitle: string;
    addEquipment: string;
    allFleet: string;
    tractors: string;
    harvesters: string;
    planters: string;
    sprayers: string;
    available: string;
    underRepair: string;
    weatherHold: string;
    scheduleMachine: string;
    manageInDispatch: string;
    registerTitle: string;
    machineryName: string;
    machineType: string;
    hourlyRateInr: string;
    workRate: string;
    horsepower: string;
    baseDepot: string;
    saveMachinery: string;
    cancel: string;
  };
  plots: {
    title: string;
    subtitle: string;
    registerPlot: string;
    plotArea: string;
    needs: string;
    location: string;
    deadline: string;
    bookForPlot: string;
    modalTitle: string;
    plotName: string;
    cropType: string;
    plotSizeAcres: string;
    machineryNeeded: string;
    villageZone: string;
    soilCondition: string;
    requiredStart: string;
    hardDeadline: string;
    savePlot: string;
  };
  dispatch: {
    title: string;
    subtitle: string;
    optimizeBtn: string;
    resetSeed: string;
    timelineTitle: string;
    timelineSub: string;
    conflictQueueTitle: string;
    conflictQueueSub: string;
    acceptRequest: string;
    disruptionTitle: string;
    disruptionSub: string;
    rainAlertBtn: string;
    breakdownBtn: string;
    affectedMachine: string;
    impactRadius: string;
    delayHours: string;
    triggerBtn: string;
    markCleared: string;
    resolved: string;
    farmerTitle: string;
    farmerSubtitle: string;
    farmerTimelineTitle: string;
    farmerTimelineSub: string;
    farmerAlertsTitle: string;
  };
  booking: {
    title: string;
    subtitle: string;
    stepPlot: string;
    stepEquipment: string;
    stepStart: string;
    slotAvailable: string;
    slotOverlap: string;
    roadTransit: string;
    fieldWork: string;
    estTotal: string;
    useNextSlot: string;
    notesLabel: string;
    submitBtn: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    brand: 'AgroHub',
    nav: {
      overview: 'Overview',
      machinery: 'Machinery',
      plots: 'Farm Plots',
      dispatch: 'Dispatch',
      myBookings: 'My Bookings',
      bookMachine: 'Book Machine',
      addEquipment: 'Add Equipment',
      mobileHome: 'Home',
      mobileFleet: 'Fleet',
      mobilePlots: 'Plots',
      mobileSchedule: 'Schedule',
    },
    toolbar: {
      view: 'View',
      roleAll: 'Co-op Dispatch',
      roleFarmer: 'Farmer',
      roleOwner: 'Owner',
      searchPlaceholder: 'Search crop, machine…',
      searchLabel: 'Search machinery, crops, or villages',
      darkGlass: 'Dark Glass',
      sunlightMode: 'Sunlight Mode',
      languageLabel: 'Language',
      signOut: 'Sign Out',
    },
    login: {
      kicker: 'AgroHub Field Network · Smart Equipment Dispatch',
      showcaseTitle: 'Machinery sharing built for real field deadlines.',
      showcaseSubtitle:
        'Connect smallholder farmers with verified tractor and harvester owners using route-aware scheduling and weather recovery.',
      farmerFeatureTitle: 'For Farmers',
      farmerFeatureSub: 'Book tractors & harvesters with transparent ₹/hr rates',
      ownerFeatureTitle: 'For Machinery Owners',
      ownerFeatureSub: 'Approve bookings & cut empty road travel across villages',
      title: 'Sign in to AgroHub',
      subtitle: 'Choose your account role and sign in with phone or Google',
      roleLabel: 'Select Account Type',
      farmerOption: 'Farmer',
      farmerHint: 'Book machinery',
      ownerOption: 'Owner',
      ownerHint: 'Manage fleet',
      signInTab: 'Sign In',
      registerTab: 'Create Account',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'e.g. Ramesh Gowda',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '+91 98450 12084',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password',
      submitFarmer: 'Sign In as Farmer',
      submitOwner: 'Sign In as Owner',
      registerFarmer: 'Create Farmer Account',
      registerOwner: 'Create Owner Account',
      orDivider: 'OR',
      googleBtn: 'Sign in with Google',
      demoFillLabel: 'Use Demo Credentials',
      demoCredentialsHint: 'Demo',
      signingIn: 'Signing in…',
    },
    overview: {
      kickerAll: 'AgroHub Cooperative Dispatch · Travel & Deadline Engine',
      kickerFarmer: 'AgroHub Farmer Workspace · Field Bookings & Plots',
      kickerOwner: 'AgroHub Owner Console · Fleet Utilization & Approvals',
      heroTitle:
        'Shared farm machinery, scheduled around road travel and harvest deadlines.',
      heroSubtitle:
        'Book nearby tractors, harvesters, and planters with automatic field work-rate estimates, conflict-free transit buffers, and instant rain or breakdown recovery.',
      farmerHeroTitle:
        'Book nearby farm machinery timed to your sowing and harvest deadlines.',
      farmerHeroSubtitle:
        'Register your farm plots, check transparent ₹/hr rates with automatic transit & field duration estimates, and track owner approvals in real time.',
      ownerHeroTitle:
        'Manage your machinery fleet, approve requests, and cut empty road travel.',
      ownerHeroSubtitle:
        'Review farmer booking requests ranked by deadline urgency, optimize multi-village dispatch routes, and auto-reschedule on rain or breakdowns.',
      bookMachinery: 'Book Machinery',
      managePlots: 'Manage Farm Plots',
      optimizeRoute: 'Optimize Route & Schedule',
      optimizing: 'Optimizing Routes…',
      liveFieldCoverage: 'Live Field Coverage',
      readyMachinery: 'Ready Machinery',
      readySub: 'Units clear for dispatch',
      scheduledCoverage: 'Scheduled Coverage',
      activePlots: 'Farm Plots',
      activePlotsSub: 'Registered for work',
      myBookingsCount: 'My Bookings',
      myBookingsCountSub: 'Confirmed & pending slots',
      scheduledRevenue: 'Scheduled Revenue',
      revenueSub: 'Confirmed & active fleet jobs',
      pendingApprovals: 'Pending Approvals',
      pendingSub: 'Sorted by deadline urgency',
      transitSaved: 'Transit Saved',
      transitSubOptimized: 'Last route optimization',
      transitSubDefault: 'Run optimizer to minimize km',
      mapTitle: 'Geospatial Dispatch Map',
      mapSubtitle:
        'Live GPS positions of machinery bases, farm plots, and chained transit paths',
      priorityQueueTitle: 'Priority Approval Queue',
      priorityQueueSub: 'Ranked automatically by harvest/planting deadline proximity',
      myBookingsTitle: 'My Booking Requests',
      myBookingsSub: 'Track approval status, arrival times, and ₹ estimates',
      fullSchedule: 'Full Schedule',
      accept: 'Accept',
      reject: 'Reject',
      inspectRecovery: 'Inspect Recovery',
      allProcessed: 'All farmer booking requests are processed',
      requestMachine: 'Request Machine',
    },
    machinery: {
      title: 'Machinery Registry',
      subtitle:
        'Verified tractors, harvesters, planters, and sprayers with real field work-rates',
      ownerSubtitle:
        'Your registered tractors, harvesters, planters, and sprayers available for dispatch',
      addEquipment: 'Add Equipment',
      allFleet: 'All Fleet',
      tractors: 'Tractors',
      harvesters: 'Harvesters',
      planters: 'Planters',
      sprayers: 'Sprayers',
      available: 'Available',
      underRepair: 'Under Repair',
      weatherHold: 'Weather Hold',
      scheduleMachine: 'Schedule This Machine',
      manageInDispatch: 'View Fleet Schedule',
      registerTitle: 'Register Machinery',
      machineryName: 'Machinery Name',
      machineType: 'Machine Type',
      hourlyRateInr: 'Hourly Rate (₹/hr)',
      workRate: 'Work Rate (acres/hr)',
      horsepower: 'Horsepower (HP)',
      baseDepot: 'Base Depot Village',
      saveMachinery: 'Save Machinery',
      cancel: 'Cancel',
    },
    plots: {
      title: 'Farm Plot Registry',
      subtitle:
        'Plots sorted by operational deadline proximity to protect planting and harvest windows',
      registerPlot: 'Register Farm Plot',
      plotArea: 'Plot Area',
      needs: 'Needs',
      location: 'Location',
      deadline: 'Deadline',
      bookForPlot: 'Book Machine for Plot',
      modalTitle: 'Register Farm Plot',
      plotName: 'Plot Name',
      cropType: 'Crop Type',
      plotSizeAcres: 'Plot Size (Acres)',
      machineryNeeded: 'Machinery Needed',
      villageZone: 'Village Zone',
      soilCondition: 'Soil Condition',
      requiredStart: 'Required Start (UTC)',
      hardDeadline: 'Hard Deadline (UTC)',
      savePlot: 'Save Farm Plot',
    },
    dispatch: {
      title: 'Dispatch Schedule & Disruption Recovery',
      subtitle:
        'Optimize fleet transit routes, resolve deadline conflicts, and cascade weather or breakdown recovery',
      optimizeBtn: 'Optimize Route & Schedule',
      resetSeed: 'Reset Seed Data',
      timelineTitle: 'Fleet Route & Time-Slot Timeline',
      timelineSub:
        'Each slot combines road transit time from the previous location plus field work duration',
      conflictQueueTitle: 'Conflict & Priority Queue',
      conflictQueueSub: 'Requests sorted by deadline proximity and crop criticality',
      acceptRequest: 'Accept Request',
      disruptionTitle: 'Disruption Handler & Auto-Reschedule',
      disruptionSub:
        'Report rain or mechanical failure to automatically cascade schedule shifts and reassign backups',
      rainAlertBtn: 'Heavy Rain Alert',
      breakdownBtn: 'Machine Breakdown',
      affectedMachine: 'Affected Machine',
      impactRadius: 'Weather Impact Radius (km)',
      delayHours: 'Delay / Repair Window (Hours)',
      triggerBtn: 'Trigger Disruption & Auto-Reschedule',
      markCleared: 'Mark Cleared',
      resolved: 'Resolved',
      farmerTitle: 'My Bookings & Field Schedule',
      farmerSubtitle:
        'Track machine arrival windows, road transit buffers, and live weather delay notices for your plots',
      farmerTimelineTitle: 'Scheduled Equipment Slots',
      farmerTimelineSub:
        'Confirmed and pending machine windows including road travel from nearby depots',
      farmerAlertsTitle: 'Field Weather & Delay Notices',
    },
    booking: {
      title: 'Book Machinery & Check Travel Window',
      subtitle:
        'Availability engine automatically reserves road transit and work duration',
      stepPlot: '1. Select Farm Plot',
      stepEquipment: '2. Select Equipment',
      stepStart: '3. Desired Field Start Time (UTC)',
      slotAvailable: 'Slot Available (No Overlaps)',
      slotOverlap: 'Schedule Overlap Detected',
      roadTransit: 'Road Transit',
      fieldWork: 'Field Work',
      estTotal: 'Est. Total',
      useNextSlot: 'Use Next Open Slot',
      notesLabel: 'Field Access Notes (Optional)',
      submitBtn: 'Send Booking Request',
    },
  },
  kn: {
    brand: 'AgroHub',
    nav: {
      overview: 'ಅವಲೋಕನ',
      machinery: 'ಯಂತ್ರಗಳು',
      plots: 'ಕೃಷಿ ಭೂಮಿ',
      dispatch: 'ವೇಳಾಪಟ್ಟಿ',
      myBookings: 'ನನ್ನ ಬುಕಿಂಗ್',
      bookMachine: 'ಯಂತ್ರ ಬುಕ್ ಮಾಡಿ',
      addEquipment: 'ಯಂತ್ರ ಸೇರಿಸಿ',
      mobileHome: 'ಮುಖಪುಟ',
      mobileFleet: 'ಯಂತ್ರಗಳು',
      mobilePlots: 'ಭೂಮಿ',
      mobileSchedule: 'ವೇಳಾಪಟ್ಟಿ',
    },
    toolbar: {
      view: 'ನೋಟ',
      roleAll: 'ಒಕ್ಕೂಟ ನಿಯಂತ್ರಣ',
      roleFarmer: 'ರೈತ',
      roleOwner: 'ಮಾಲೀಕ',
      searchPlaceholder: 'ಬೆಳೆ, ಯಂತ್ರ ಹುಡುಕಿ…',
      searchLabel: 'ಯಂತ್ರ, ಬೆಳೆ ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ',
      darkGlass: 'ಡಾರ್ಕ್ ಮೋಡ್',
      sunlightMode: 'ಬಿಸಿಲು ಮೋಡ್',
      languageLabel: 'ಭಾಷೆ',
      signOut: 'ಸೈನ್ ಔಟ್',
    },
    login: {
      kicker: 'AgroHub ಕೃಷಿ ಜಾಲ · ಸ್ಮಾರ್ಟ್ ಯಂತ್ರ ವೇಳಾಪಟ್ಟಿ',
      showcaseTitle: 'ಕೃಷಿ ಗಡುವಿಗೆ ತಕ್ಕಂತೆ ಯಂತ್ರ ಹಂಚಿಕೆ ವೇದಿಕೆ.',
      showcaseSubtitle:
        'ಸಮೀಪದ ಟ್ರ್ಯಾಕ್ಟರ್ ಮತ್ತು ಕೊಯ್ಲು ಯಂತ್ರ ಮಾಲೀಕರನ್ನು ರೈತರೊಂದಿಗೆ ರಸ್ತೆ ಪ್ರಯಾಣ ಸಮಯದ ಆಧಾರದ ಮೇಲೆ ಸಂಪರ್ಕಿಸಿ.',
      farmerFeatureTitle: 'ರೈತರಿಗಾಗಿ',
      farmerFeatureSub: 'ಸ್ಪಷ್ಟ ₹/ಗಂಟೆ ದರದಲ್ಲಿ ಟ್ರ್ಯಾಕ್ಟರ್ ಮತ್ತು ಯಂತ್ರ ಬುಕ್ ಮಾಡಿ',
      ownerFeatureTitle: 'ಯಂತ್ರ ಮಾಲೀಕರಿಗಾಗಿ',
      ownerFeatureSub: 'ಬುಕಿಂಗ್ ಅನುಮೋದಿಸಿ ಮತ್ತು ಗ್ರಾಮಗಳ ನಡುವಿನ ಪ್ರಯಾಣ ಕಡಿಮೆ ಮಾಡಿ',
      title: 'AgroHub ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
      subtitle: 'ನಿಮ್ಮ ಖಾತೆ ವಿಧವನ್ನು ಆರಿಸಿ ಫೋನ್ ಅಥವಾ Google ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ',
      roleLabel: 'ಖಾತೆ ವಿಧ ಆರಿಸಿ',
      farmerOption: 'ರೈತ',
      farmerHint: 'ಯಂತ್ರ ಬುಕ್ ಮಾಡಿ',
      ownerOption: 'ಮಾಲೀಕ',
      ownerHint: 'ಯಂತ್ರ ನಿರ್ವಹಿಸಿ',
      signInTab: 'ಸೈನ್ ಇನ್',
      registerTab: 'ಹೊಸ ಖಾತೆ',
      fullNameLabel: 'ಪೂರ್ಣ ಹೆಸರು',
      fullNamePlaceholder: 'ಉದಾ. ರಮೇಶ್ ಗೌಡ',
      phoneLabel: 'ಫೋನ್ ಸಂಖ್ಯೆ',
      phonePlaceholder: '+91 98450 12084',
      passwordLabel: 'ಪಾಸ್‌ವರ್ಡ್',
      passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ',
      submitFarmer: 'ರೈತರಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿ',
      submitOwner: 'ಮಾಲೀಕರಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿ',
      registerFarmer: 'ರೈತ ಖಾತೆ ತೆರೆಯಿರಿ',
      registerOwner: 'ಮಾಲೀಕ ಖಾತೆ ತೆರೆಯಿರಿ',
      orDivider: 'ಅಥವಾ',
      googleBtn: 'Sign in with Google',
      demoFillLabel: 'ಡೆಮೋ ವಿವರ ಭರ್ತಿ ಮಾಡಿ',
      demoCredentialsHint: 'ಡೆಮೋ',
      signingIn: 'ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ…',
    },
    overview: {
      kickerAll: 'AgroHub ಸಹಕಾರಿ ವೇಳಾಪಟ್ಟಿ · ಪ್ರಯಾಣ ಮತ್ತು ಗಡುವು ಎಂಜಿನ್',
      kickerFarmer: 'AgroHub ರೈತ ಸೇವೆಗಳು · ಹೊಲ ಮತ್ತು ಬುಕಿಂಗ್',
      kickerOwner: 'AgroHub ಮಾಲೀಕರ ಫಲಕ · ಯಂತ್ರ ಅನುಮೋದನೆಗಳು',
      heroTitle:
        'ರಸ್ತೆ ಪ್ರಯಾಣ ಮತ್ತು ಕೊಯ್ಲು ಗಡುವಿಗೆ ಅನುಗುಣವಾಗಿ ಹಂಚಿಕೆಯ ಕೃಷಿ ಯಂತ್ರಗಳು.',
      heroSubtitle:
        'ಸಮೀಪದ ಟ್ರ್ಯಾಕ್ಟರ್, ಕೊಯ್ಲು ಯಂತ್ರ ಮತ್ತು ಬಿತ್ತನೆ ಯಂತ್ರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತ ಕೆಲಸದ ಸಮಯ, ಪ್ರಯಾಣ ಅಂತರ ಮತ್ತು ಮಳೆ ತಡೆ ನಿವಾರಣೆಯೊಂದಿಗೆ ಬುಕ್ ಮಾಡಿ.',
      farmerHeroTitle:
        'ನಿಮ್ಮ ಬಿತ್ತನೆ ಮತ್ತು ಕೊಯ್ಲು ಗಡುವಿಗೆ ತಕ್ಕಂತೆ ಸಮೀಪದ ಕೃಷಿ ಯಂತ್ರಗಳನ್ನು ಬುಕ್ ಮಾಡಿ.',
      farmerHeroSubtitle:
        'ನಿಮ್ಮ ಕೃಷಿ ಭೂಮಿಯನ್ನು ನೋಂದಾಯಿಸಿ, ₹/ಗಂ ದರ ಮತ್ತು ಪ್ರಯಾಣ ಸಮಯವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮಾಲೀಕರ ಅನುಮೋದನೆಯನ್ನು ನೇರವಾಗಿ ಗಮನಿಸಿ.',
      ownerHeroTitle:
        'ನಿಮ್ಮ ಯಂತ್ರೋಪಕರಣಗಳನ್ನು ನಿರ್ವಹಿಸಿ, ಬುಕಿಂಗ್ ಒಪ್ಪಿ ಮತ್ತು ಪ್ರಯಾಣ ದೂರ ಕಡಿಮೆ ಮಾಡಿ.',
      ownerHeroSubtitle:
        'ರೈತರ ಬುಕಿಂಗ್ ವಿನಂತಿಗಳನ್ನು ಗಡುವಿನ ಆಧಾರದ ಮೇಲೆ ಪರಿಶೀಲಿಸಿ, ಮಾರ್ಗವನ್ನು ಉತ್ತಮಗೊಳಿಸಿ ಮತ್ತು ಮಳೆ ಅಥವಾ ದೋಷಕ್ಕೆ ಸ್ವಯಂ ಮರು-ವೇಳಾಪಟ್ಟಿ ಮಾಡಿ.',
      bookMachinery: 'ಯಂತ್ರ ಬುಕ್ ಮಾಡಿ',
      managePlots: 'ಕೃಷಿ ಭೂಮಿ ನಿರ್ವಹಿಸಿ',
      optimizeRoute: 'ಮಾರ್ಗ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ಉತ್ತಮಗೊಳಿಸಿ',
      optimizing: 'ಉತ್ತಮಗೊಳಿಸಲಾಗುತ್ತಿದೆ…',
      liveFieldCoverage: 'ಪ್ರಸ್ತುತ ಹೊಲದ ವ್ಯಾಪ್ತಿ',
      readyMachinery: 'ಸಿದ್ಧ ಯಂತ್ರಗಳು',
      readySub: 'ಕಾರ್ಯಾಚರಣೆಗೆ ಸಿದ್ಧ',
      scheduledCoverage: 'ನಿಗದಿತ ವಿಸ್ತೀರ್ಣ',
      activePlots: 'ಕೃಷಿ ಭೂಮಿ',
      activePlotsSub: 'ನೋಂದಾಯಿತ ಹೊಲಗಳು',
      myBookingsCount: 'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು',
      myBookingsCountSub: 'ದೃಢೀಕೃತ ಮತ್ತು ಬಾಕಿ',
      scheduledRevenue: 'ನಿಗದಿತ ಆದಾಯ',
      revenueSub: 'ದೃಢೀಕೃತ ಯಂತ್ರ ಕೆಲಸಗಳು',
      pendingApprovals: 'ಬಾಕಿ ಅನುಮೋದನೆಗಳು',
      pendingSub: 'ಗಡುವಿನ ಆಧಾರದ ಮೇಲೆ ಶ್ರೇಣೀಕೃತ',
      transitSaved: 'ಉಳಿಸಿದ ಪ್ರಯಾಣ',
      transitSubOptimized: 'ಕೊನೆಯ ಮಾರ್ಗ ಉಳಿತಾಯ',
      transitSubDefault: 'ಕಿ.ಮೀ ಉಳಿಸಲು ಉತ್ತಮಗೊಳಿಸಿ',
      mapTitle: 'ಭೌಗೋಳಿಕ ವೇಳಾಪಟ್ಟಿ ನಕ್ಷೆ',
      mapSubtitle: 'ಯಂತ್ರ ಕೇಂದ್ರಗಳು, ಕೃಷಿ ಭೂಮಿ ಮತ್ತು ಪ್ರಯಾಣ ಮಾರ್ಗದ ಜಿಪಿಎಸ್ ಸ್ಥಿತಿ',
      priorityQueueTitle: 'ಆದ್ಯತಾ ಅನುಮೋದನೆ ಸರತಿ',
      priorityQueueSub: 'ಕೊಯ್ಲು ಮತ್ತು ಬಿತ್ತನೆ ಗಡುವಿನ ಸಮೀಪತೆಗೆ ಅನುಗುಣವಾಗಿ',
      myBookingsTitle: 'ನನ್ನ ಯಂತ್ರ ಬುಕಿಂಗ್‌ಗಳು',
      myBookingsSub: 'ಅನುಮೋದನೆ ಸ್ಥಿತಿ, ಆಗಮನ ಸಮಯ ಮತ್ತು ₹ ವೆಚ್ಚ ನೋಡಿ',
      fullSchedule: 'ಪೂರ್ಣ ವೇಳಾಪಟ್ಟಿ',
      accept: 'ಒಪ್ಪಿ',
      reject: 'ತಿರಸ್ಕರಿಸಿ',
      inspectRecovery: 'ಪರಿಹಾರ ನೋಡಿ',
      allProcessed: 'ಎಲ್ಲಾ ರೈತರ ಬುಕಿಂಗ್ ವಿನಂತಿಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ',
      requestMachine: 'ಯಂತ್ರ ವಿನಂತಿಸಿ',
    },
    machinery: {
      title: 'ಯಂತ್ರೋಪಕರಣ ಪಟ್ಟಿ',
      subtitle: 'ನಿಖರ ಕೆಲಸದ ವೇಗದೊಂದಿಗೆ ಟ್ರ್ಯಾಕ್ಟರ್, ಕೊಯ್ಲು ಯಂತ್ರ ಮತ್ತು ಸ್ಪ್ರೇಯರ್‌ಗಳು',
      ownerSubtitle: 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಟ್ರ್ಯಾಕ್ಟರ್, ಕೊಯ್ಲು ಯಂತ್ರ ಮತ್ತು ಸ್ಪ್ರೇಯರ್‌ಗಳು',
      addEquipment: 'ಹೊಸ ಯಂತ್ರ ಸೇರಿಸಿ',
      allFleet: 'ಎಲ್ಲಾ ಯಂತ್ರಗಳು',
      tractors: 'ಟ್ರ್ಯಾಕ್ಟರ್‌ಗಳು',
      harvesters: 'ಕೊಯ್ಲು ಯಂತ್ರ',
      planters: 'ಬಿತ್ತನೆ ಯಂತ್ರ',
      sprayers: 'ಸ್ಪ್ರೇಯರ್',
      available: 'ಲಭ್ಯವಿದೆ',
      underRepair: 'ದುರಸ್ತಿಯಲ್ಲಿದೆ',
      weatherHold: 'ಮಳೆ ತಡೆ',
      scheduleMachine: 'ಈ ಯಂತ್ರ ಬುಕ್ ಮಾಡಿ',
      manageInDispatch: 'ವೇಳಾಪಟ್ಟಿ ನೋಡಿ',
      registerTitle: 'ಹೊಸ ಯಂತ್ರ ನೋಂದಣಿ',
      machineryName: 'ಯಂತ್ರದ ಹೆಸರು',
      machineType: 'ಯಂತ್ರದ ವಿಧ',
      hourlyRateInr: 'ಗಂಟೆಯ ದರ (₹/ಗಂ)',
      workRate: 'ಕೆಲಸದ ವೇಗ (ಎಕರೆ/ಗಂ)',
      horsepower: 'ಅಶ್ವಶಕ್ತಿ (HP)',
      baseDepot: 'ಮೂಲ ಗ್ರಾಮ',
      saveMachinery: 'ಯಂತ್ರ ಉಳಿಸಿ',
      cancel: 'ರದ್ದುಮಾಡಿ',
    },
    plots: {
      title: 'ಕೃಷಿ ಭೂಮಿ ನೋಂದಣಿ',
      subtitle: 'ಬಿತ್ತನೆ ಮತ್ತು ಕೊಯ್ಲು ಸಮಯ ರಕ್ಷಿಸಲು ಗಡುವಿನ ಪ್ರಕಾರ ಜೋಡಿಸಲಾದ ಹೊಲಗಳು',
      registerPlot: 'ಹೊಲ ನೋಂದಾಯಿಸಿ',
      plotArea: 'ವಿಸ್ತೀರ್ಣ',
      needs: 'ಅಗತ್ಯ ಯಂತ್ರ',
      location: 'ಸ್ಥಳ',
      deadline: 'ಕೊನೆಯ ಗಡುವು',
      bookForPlot: 'ಈ ಹೊಲಕ್ಕೆ ಯಂತ್ರ ಬುಕ್ ಮಾಡಿ',
      modalTitle: 'ಕೃಷಿ ಭೂಮಿ ಸೇರಿಸಿ',
      plotName: 'ಹೊಲದ ಹೆಸರು',
      cropType: 'ಬೆಳೆ ವಿಧ',
      plotSizeAcres: 'ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)',
      machineryNeeded: 'ಬೇಕಾದ ಯಂತ್ರ',
      villageZone: 'ಗ್ರಾಮ ವಲಯ',
      soilCondition: 'ಮಣ್ಣಿನ ಸ್ಥಿತಿ',
      requiredStart: 'ಪ್ರಾರಂಭ ಸಮಯ (UTC)',
      hardDeadline: 'ಕೊನೆಯ ಗಡುವು (UTC)',
      savePlot: 'ಹೊಲ ಉಳಿಸಿ',
    },
    dispatch: {
      title: 'ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಅಡಚಣೆ ನಿವಾರಣೆ',
      subtitle: 'ಪ್ರಯಾಣ ದೂರ ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಮಳೆ ಅಥವಾ ಯಂತ್ರ ದೋಷಕ್ಕೆ ಸ್ವಯಂ ಬದಲಿ ವ್ಯವಸ್ಥೆ ಮಾಡಿ',
      optimizeBtn: 'ಮಾರ್ಗ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ಉತ್ತಮಗೊಳಿಸಿ',
      resetSeed: 'ಮೂಲ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ',
      timelineTitle: 'ಯಂತ್ರ ಮಾರ್ಗ ಮತ್ತು ಸಮಯ ವೇಳಾಪಟ್ಟಿ',
      timelineSub: 'ಪ್ರತಿ ಸ್ಲಾಟ್ ರಸ್ತೆ ಪ್ರಯಾಣ ಮತ್ತು ಹೊಲದ ಕೆಲಸದ ಸಮಯವನ್ನು ಒಳಗೊಂಡಿದೆ',
      conflictQueueTitle: 'ಆದ್ಯತಾ ವಿನಂತಿ ಸರತಿ',
      conflictQueueSub: 'ಗಡುವು ಮತ್ತು ಬೆಳೆ ತುರ್ತು ಆಧಾರಿತ',
      acceptRequest: 'ವಿನಂತಿ ಒಪ್ಪಿ',
      disruptionTitle: 'ಮಳೆ / ದೋಷ ನಿವಾರಕ',
      disruptionSub: 'ಮಳೆ ಅಥವಾ ಯಂತ್ರ ದೋಷ ವರದಿ ಮಾಡಿ ಸ್ವಯಂ ಮರು-ವೇಳಾಪಟ್ಟಿ ಚಾಲನೆ ಮಾಡಿ',
      rainAlertBtn: 'ಭಾರಿ ಮಳೆ ಎಚ್ಚರಿಕೆ',
      breakdownBtn: 'ಯಂತ್ರ ದೋಷ',
      affectedMachine: 'ಬಾಧಿತ ಯಂತ್ರ',
      impactRadius: 'ಮಳೆ ವ್ಯಾಪ್ತಿ (ಕಿ.ಮೀ)',
      delayHours: 'ವಿಳಂಬ ಅವಧಿ (ಗಂಟೆಗಳು)',
      triggerBtn: 'ಅಡಚಣೆ ವರದಿ ಮತ್ತು ಸ್ವಯಂ ಬದಲಾವಣೆ',
      markCleared: 'ಸರಿಪಡಿಸಲಾಗಿದೆ',
      resolved: 'ಪರಿಹಾರವಾಗಿದೆ',
      farmerTitle: 'ನನ್ನ ಬುಕಿಂಗ್ ಮತ್ತು ಹೊಲದ ವೇಳಾಪಟ್ಟಿ',
      farmerSubtitle:
        'ನಿಮ್ಮ ಹೊಲಗಳಿಗೆ ಯಂತ್ರದ ಆಗಮನ ಸಮಯ, ಪ್ರಯಾಣ ಅವಧಿ ಮತ್ತು ಮಳೆ ವಿಳಂಬ ಸೂಚನೆಗಳನ್ನು ಗಮನಿಸಿ',
      farmerTimelineTitle: 'ನಿಗದಿತ ಯಂತ್ರ ಸಮಯಗಳು',
      farmerTimelineSub: 'ಸಮೀಪದ ಕೇಂದ್ರಗಳಿಂದ ಪ್ರಯಾಣ ಸಮಯದೊಂದಿಗೆ ದೃಢೀಕೃತ ಮತ್ತು ಬಾಕಿ ಬುಕಿಂಗ್‌ಗಳು',
      farmerAlertsTitle: 'ಹೊಲದ ಹವಾಮಾನ ಮತ್ತು ವಿಳಂಬ ಸೂಚನೆಗಳು',
    },
    booking: {
      title: 'ಯಂತ್ರ ಬುಕಿಂಗ್ ಮತ್ತು ಲಭ್ಯತೆ ಪರಿಶೀಲನೆ',
      subtitle: 'ಲಭ್ಯತೆ ಎಂಜಿನ್ ಪ್ರಯಾಣ ಮತ್ತು ಕೆಲಸದ ಸಮಯವನ್ನು ಸ್ವಯಂ ಕಾಯ್ದಿರಿಸುತ್ತದೆ',
      stepPlot: '1. ಕೃಷಿ ಹೊಲ ಆಯ್ಕೆಮಾಡಿ',
      stepEquipment: '2. ಯಂತ್ರ ಆಯ್ಕೆಮಾಡಿ',
      stepStart: '3. ಬಯಸಿದ ಪ್ರಾರಂಭ ಸಮಯ (UTC)',
      slotAvailable: 'ಸಮಯ ಲಭ್ಯವಿದೆ (ಯಾವುದೇ ಅಡಚಣೆ ಇಲ್ಲ)',
      slotOverlap: 'ಸಮಯದ ಸಂಘರ್ಷ ಪತ್ತೆಯಾಗಿದೆ',
      roadTransit: 'ರಸ್ತೆ ಪ್ರಯಾಣ',
      fieldWork: 'ಹೊಲದ ಕೆಲಸ',
      estTotal: 'ಅಂದಾಜು ವೆಚ್ಚ',
      useNextSlot: 'ಮುಂದಿನ ಖಾಲಿ ಸಮಯ ಬಳಸಿ',
      notesLabel: 'ಹೊಲದ ಪ್ರವೇಶ ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ)',
      submitBtn: 'ಬುಕಿಂಗ್ ವಿನಂತಿ ಕಳುಹಿಸಿ',
    },
  },
  hi: {
    brand: 'AgroHub',
    nav: {
      overview: 'अवलोकन',
      machinery: 'मशीनरी',
      plots: 'खेत प्लॉट',
      dispatch: 'शेड्यूल',
      myBookings: 'मेरी बुकिंग',
      bookMachine: 'मशीन बुक करें',
      addEquipment: 'मशीन जोड़ें',
      mobileHome: 'होम',
      mobileFleet: 'मशीनें',
      mobilePlots: 'खेत',
      mobileSchedule: 'शेड्यूल',
    },
    toolbar: {
      view: 'दृश्य',
      roleAll: 'सहकारी डिस्पैच',
      roleFarmer: 'किसान',
      roleOwner: 'मालिक',
      searchPlaceholder: 'फसल, मशीन खोजें…',
      searchLabel: 'मशीन, फसल या गाँव खोजें',
      darkGlass: 'डार्क मोड',
      sunlightMode: 'सनलाइट मोड',
      languageLabel: 'भाषा',
      signOut: 'साइन आउट',
    },
    login: {
      kicker: 'AgroHub कृषि नेटवर्क · स्मार्ट मशीन शेड्यूल',
      showcaseTitle: 'खेती की समय-सीमा के लिए साझा मशीनरी मंच।',
      showcaseSubtitle:
        'किसानों को नजदीकी ट्रैक्टर और हार्वेस्टर मालिकों से रीयल-टाइम रूट और मौसम सुरक्षा के साथ जोड़ें।',
      farmerFeatureTitle: 'किसानों के लिए',
      farmerFeatureSub: 'स्पष्ट ₹/घंटा दर पर ट्रैक्टर और मशीन बुक करें',
      ownerFeatureTitle: 'मशीन मालिकों के लिए',
      ownerFeatureSub: 'बुकिंग स्वीकार करें और खाली सड़क यात्रा घटाएँ',
      title: 'AgroHub में साइन इन करें',
      subtitle: 'अपना खाता प्रकार चुनें और फ़ोन या Google से लॉगिन करें',
      roleLabel: 'खाता प्रकार चुनें',
      farmerOption: 'किसान',
      farmerHint: 'मशीन बुक करें',
      ownerOption: 'मालिक',
      ownerHint: 'मशीन प्रबंधन',
      signInTab: 'साइन इन',
      registerTab: 'नया खाता',
      fullNameLabel: 'पूरा नाम',
      fullNamePlaceholder: 'जैसे रमेश पाटिल',
      phoneLabel: 'फ़ोन नंबर',
      phonePlaceholder: '+91 98450 12084',
      passwordLabel: 'पासवर्ड',
      passwordPlaceholder: 'पासवर्ड दर्ज करें',
      submitFarmer: 'किसान के रूप में साइन इन करें',
      submitOwner: 'मालिक के रूप में साइन इन करें',
      registerFarmer: 'किसान खाता बनाएँ',
      registerOwner: 'मालिक खाता बनाएँ',
      orDivider: 'या',
      googleBtn: 'Sign in with Google',
      demoFillLabel: 'डेमो विवरण भरें',
      demoCredentialsHint: 'डेमो',
      signingIn: 'साइन इन हो रहा है…',
    },
    overview: {
      kickerAll: 'AgroHub सहकारी डिस्पैच · यात्रा एवं समय-सीमा इंजन',
      kickerFarmer: 'AgroHub किसान संचालन · खेत एवं बुकिंग',
      kickerOwner: 'AgroHub मालिक पैनल · मशीन उपयोग और स्वीकृति',
      heroTitle:
        'सड़क यात्रा और कटाई की समय-सीमा के अनुसार साझा कृषि मशीनरी शेड्यूलिंग।',
      heroSubtitle:
        'नजदीकी ट्रैक्टर, हार्वेस्टर और प्लांटर को सटीक कार्य-दर, यात्रा समय बफर और बारिश या खराबी के स्वचालित विकल्प के साथ बुक करें।',
      farmerHeroTitle:
        'अपनी बुवाई और कटाई समय-सीमा के अनुसार नजदीकी कृषि मशीन बुक करें।',
      farmerHeroSubtitle:
        'अपने खेत जोड़ें, स्पष्ट ₹/घंटा दर और यात्रा अवधि देखें और मालिक की स्वीकृति रीयल-टाइम में ट्रैक करें।',
      ownerHeroTitle:
        'अपनी मशीनें प्रबंधित करें, बुकिंग स्वीकार करें और खाली सड़क यात्रा घटाएँ।',
      ownerHeroSubtitle:
        'समय-सीमा के अनुसार किसान अनुरोधों की समीक्षा करें, मल्टी-विलेज रूट अनुकूलित करें और बारिश या खराबी पर ऑटो री-शेड्यूल करें।',
      bookMachinery: 'मशीन बुक करें',
      managePlots: 'खेत प्लॉट देखें',
      optimizeRoute: 'रूट और शेड्यूल अनुकूलित करें',
      optimizing: 'रूट अनुकूलित हो रहा है…',
      liveFieldCoverage: 'लाइव खेत कवरेज',
      readyMachinery: 'उपलब्ध मशीनें',
      readySub: 'डिस्पैच के लिए तैयार',
      scheduledCoverage: 'निर्धारित क्षेत्रफल',
      activePlots: 'खेत प्लॉट',
      activePlotsSub: 'कार्य के लिए पंजीकृत',
      myBookingsCount: 'मेरी बुकिंग',
      myBookingsCountSub: 'स्वीकृत और लंबित',
      scheduledRevenue: 'निर्धारित आय',
      revenueSub: 'स्वीकृत व सक्रिय कार्य',
      pendingApprovals: 'लंबित स्वीकृतियाँ',
      pendingSub: 'समय-सीमा प्राथमिकता के अनुसार',
      transitSaved: 'बचाई गई दूरी',
      transitSubOptimized: 'अंतिम रूट अनुकूलन',
      transitSubDefault: 'दूरी घटाने के लिए अनुकूलित करें',
      mapTitle: 'भू-स्थानिक डिस्पैच मानचित्र',
      mapSubtitle: 'मशीन डिपो, खेत प्लॉट और सक्रिय रूट की लाइव जीपीएस स्थिति',
      priorityQueueTitle: 'प्राथमिकता स्वीकृति कतार',
      priorityQueueSub: 'बुवाई व कटाई समय-सीमा की निकटता के अनुसार क्रमबद्ध',
      myBookingsTitle: 'मेरे बुकिंग अनुरोध',
      myBookingsSub: 'स्वीकृति स्थिति, समय और ₹ अनुमान देखें',
      fullSchedule: 'पूरा शेड्यूल',
      accept: 'स्वीकार करें',
      reject: 'अस्वीकार करें',
      inspectRecovery: 'रिकवरी देखें',
      allProcessed: 'सभी किसान बुकिंग अनुरोध संसाधित हो चुके हैं',
      requestMachine: 'मशीन अनुरोध करें',
    },
    machinery: {
      title: 'मशीनरी रजिस्ट्री',
      subtitle: 'वास्तविक कार्य-दर वाले सत्यापित ट्रैक्टर, हार्वेस्टर, प्लांटर और स्प्रेयर',
      ownerSubtitle: 'डिस्पैच के लिए आपके पंजीकृत ट्रैक्टर, हार्वेस्टर और स्प्रेयर',
      addEquipment: 'मशीन जोड़ें',
      allFleet: 'सभी मशीनें',
      tractors: 'ट्रैक्टर',
      harvesters: 'हार्वेस्टर',
      planters: 'प्लांटर',
      sprayers: 'स्प्रेयर',
      available: 'उपलब्ध',
      underRepair: 'मरम्मत जारी',
      weatherHold: 'बारिश रोक',
      scheduleMachine: 'इस मशीन को शेड्यूल करें',
      manageInDispatch: 'फ्लीट शेड्यूल देखें',
      registerTitle: 'मशीनरी पंजीकरण',
      machineryName: 'मशीन का नाम',
      machineType: 'मशीन प्रकार',
      hourlyRateInr: 'प्रति घंटा दर (₹/घंटा)',
      workRate: 'कार्य दर (एकड़/घंटा)',
      horsepower: 'हॉर्सपावर (HP)',
      baseDepot: 'आधार गाँव डिपो',
      saveMachinery: 'मशीन सहेजें',
      cancel: 'रद्द करें',
    },
    plots: {
      title: 'खेत प्लॉट रजिस्ट्री',
      subtitle: 'बुवाई और कटाई समय बचाने हेतु समय-सीमा प्राथमिकता से क्रमबद्ध खेत',
      registerPlot: 'नया खेत जोड़ें',
      plotArea: 'क्षेत्रफल',
      needs: 'आवश्यक मशीन',
      location: 'स्थान',
      deadline: 'अंतिम समय-सीमा',
      bookForPlot: 'खेत के लिए मशीन बुक करें',
      modalTitle: 'खेत प्लॉट पंजीकरण',
      plotName: 'खेत का नाम',
      cropType: 'फसल प्रकार',
      plotSizeAcres: 'क्षेत्रफल (एकड़)',
      machineryNeeded: 'आवश्यक मशीन',
      villageZone: 'गाँव क्षेत्र',
      soilCondition: 'मिट्टी की स्थिति',
      requiredStart: 'शुरुआती समय (UTC)',
      hardDeadline: 'अंतिम समय-सीमा (UTC)',
      savePlot: 'खेत सहेजें',
    },
    dispatch: {
      title: 'डिस्पैच शेड्यूल और व्यवधान रिकवरी',
      subtitle: 'यात्रा दूरी कम करें, प्राथमिकता विवाद सुलझाएँ और बारिश या खराबी में स्वतः री-शेड्यूल करें',
      optimizeBtn: 'रूट और शेड्यूल अनुकूलित करें',
      resetSeed: 'डेटा रीसेट करें',
      timelineTitle: 'फ्लीट रूट और समय-स्लॉट टाइमलाइन',
      timelineSub: 'प्रत्येक स्लॉट में सड़क यात्रा समय और खेत कार्य अवधि शामिल है',
      conflictQueueTitle: 'विवाद और प्राथमिकता कतार',
      conflictQueueSub: 'समय-सीमा और फसल आवश्यकता के अनुसार क्रमबद्ध',
      acceptRequest: 'अनुरोध स्वीकार करें',
      disruptionTitle: 'व्यवधान प्रबंधन और ऑटो री-शेड्यूल',
      disruptionSub: 'बारिश या खराबी दर्ज कर स्वतः समय बदलें और बैकअप मशीन नियुक्त करें',
      rainAlertBtn: 'भारी बारिश अलर्ट',
      breakdownBtn: 'मशीन खराबी',
      affectedMachine: 'प्रभावित मशीन',
      impactRadius: 'मौसम प्रभाव दायरा (किमी)',
      delayHours: 'विलंब / मरम्मत अवधि (घंटे)',
      triggerBtn: 'व्यवधान दर्ज कर री-शेड्यूल करें',
      markCleared: 'साफ़ चिह्नित करें',
      resolved: 'सुलझाया गया',
      farmerTitle: 'मेरी बुकिंग और खेत शेड्यूल',
      farmerSubtitle:
        'अपने खेतों के लिए मशीन आगमन समय, यात्रा अवधि और लाइव मौसम अलर्ट देखें',
      farmerTimelineTitle: 'निर्धारित मशीन समय स्लॉट',
      farmerTimelineSub: 'सड़क यात्रा समय सहित आपकी स्वीकृत और लंबित बुकिंग',
      farmerAlertsTitle: 'खेत मौसम और देरी सूचनाएँ',
    },
    booking: {
      title: 'मशीन बुकिंग और यात्रा समय जांच',
      subtitle: 'उपलब्धता इंजन यात्रा और खेत कार्य समय स्वतः आरक्षित करता है',
      stepPlot: '1. खेत प्लॉट चुनें',
      stepEquipment: '2. मशीन चुनें',
      stepStart: '3. इच्छित प्रारंभ समय (UTC)',
      slotAvailable: 'स्लॉट उपलब्ध (कोई टकराव नहीं)',
      slotOverlap: 'समय टकराव पाया गया',
      roadTransit: 'सड़क यात्रा',
      fieldWork: 'खेत कार्य',
      estTotal: 'अनुमानित कुल',
      useNextSlot: 'अगला खाली स्लॉट चुनें',
      notesLabel: 'खेत प्रवेश नोट्स (वैकल्पिक)',
      submitBtn: 'बुकिंग अनुरोध भेजें',
    },
  },
};
