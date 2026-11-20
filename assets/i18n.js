(function () {
  var STORAGE_KEY = "yahya_site_lang";
  var DEFAULT_LANG = "ar";
  var SUPPORTED = ["ar","en","fr","es","de","tr","ru","pt","it","nl","id","hi","ur","fa","zh","ja","ko"];

  var BASE = {
    "menu.main":"القائمة","menu.settings":"الإعدادات واللغات","menu.quick":"روابط سريعة","menu.language":"اللغة","menu.theme":"الثيم","menu.close":"إغلاق","menu.sections":"الأقسام - اختر أي مكان",
    "nav.home":"الرئيسية","nav.search":"بحث","nav.apps":"التطبيقات","nav.stats":"الأرقام","nav.clock":"الساعة","nav.services":"الخدمات","nav.live":"البث","nav.about":"عنّي","nav.contact":"تواصل","nav.settings":"الإعدادات","nav.download":"التحميل","nav.admin":"لوحة المالك","nav.library":"المعرض والمكتبة",
    "action.login":"تسجيل الدخول","action.downloadApps":"تحميل التطبيقات","action.browseApps":"تصفح التطبيقات","action.searchWeb":"ابحث في الإنترنت","action.contact":"تواصل معي","action.shareSite":"مشاركة الموقع","action.copyLink":"نسخ رابط الموقع","action.backHome":"العودة للرئيسية","action.allApps":"كل التطبيقات","action.search":"بحث","action.backSite":"العودة للموقع","action.details":"التفاصيل","action.downloadApk":"تحميل APK","action.requestActivate":"طلب التفعيل",
    "hero.eyebrow":"مطور أندرويد · تشخيص هواتف · أدوات تقنية","hero.lead":"أبني تطبيقات أندرويد عملية وأدوات تشخيص هواتف تعمل أوفلاين، بتركيز على الوضوح والدقة وسهولة الاستخدام.","hero.muted":"من الرقة، سوريا. تطبيقاتي تشمل Smart Phone Detective وNoor Al-Fajr وYahya Manager وRepairLive، إضافة إلى Yahya Shield وYahya Account Help وYahya Games Topup ووحدة نظام Magisk.",
    "stats.apps":"تطبيقات منشورة","stats.issues":"عطلًا في الموسوعة","stats.offline":"أدوات أوفلاين",
    "section.stats":"الموقع بالأرقام","section.search":"ابحث في الإنترنت كله","section.apps":"حمّل تطبيقاتي بعد تسجيل الدخول","section.clock":"ساعة سوريا","section.services":"تطوير وأدوات تشخيص","section.live":"آخر الفيديوهات والبث المباشر","section.about":"نبذة عنّي","section.contact":"تواصل معي","section.library":"مناظر طبيعية وصور للتحميل (محلي + Google)","section.tech":"مكتبة فنية ومشاكل وحلول",
    "footer.rights":"صُنع بعناية، ويعمل على GitHub Pages.","footer.admin":"رفع تطبيق من الهاتف","footer.settings":"إعدادات الموقع ومسح الكاش",
    "settings.title":"إعدادات الموقع","settings.cache":"مسح الكاش وتحديث الموقع","settings.cacheBtn":"مسح الكاش وإعادة التحميل","settings.cacheKeep":"لن يحذف هذا حساباتك على الخدمات الخارجية، فقط بيانات التخزين المحلي/الكاش لهذا الموقع (سيتم الاحتفاظ بـ GitHub Token المحفوظ).","settings.theme":"ثيم الموقع","settings.sound":"أصوات الأزرار","settings.info":"معلومات",
    "card.apps":"مكتبة التطبيقات","card.settings":"إعدادات الموقع","card.library":"المعرض والمكتبة","card.contact":"تواصل","card.download":"صفحة التحميل","card.admin":"لوحة المالك","card.home":"الصفحة الرئيسية",
    "filter.all":"الكل","filter.tools":"أدوات","filter.islamic":"أذكار","filter.security":"حماية","filter.games":"شحن ألعاب","filter.diagnostics":"تشخيص","filter.system":"نظامي",
    "label.share":"مشاركة:","label.copyLinkBtn":"نسخ الرابط","label.openSource":"فتح المصدر الأصلي","label.reading":"قراءة داخل الموقع","label.loadingPage":"جاري تحميل الصفحة...","label.addScreens":"إضافة لقطات شاشة","label.showToken":"إظهار التوكن","label.hideToken":"إخفاء التوكن","label.saveToken":"حفظ التوكن",
    "ph.searchWeb":"اكتب ما تريد البحث عنه...","ph.searchApp":"ابحث باسم التطبيق أو الوصف...",
    "status.webReady":"بحث ويب كامل داخل الموقع عبر Tavily. النتائج تظهر هنا، ويمكنك قراءة الصفحة دون مغادرة الموقع.",
    "404.title":"الصفحة غير موجودة","404.desc":"قد يكون الرابط قديمًا أو تم نقل الصفحة.",
    "clock.local":"الوقت المحلي","clock.live":"تتحدّث كل ثانية","clock.now":"الوقت الآن في دمشق","clock.damascus":"توقيت دمشق","clock.updating":"تحديث مباشر",
    "stats.live":"أرقام مباشرة","stats.updateNote":"تُحدّث عند فتح الصفحة (قد تتأخر ثوانٍ)","stats.visitors":"الزوار","stats.unique":"زائر فريد","stats.registered":"المسجلون","stats.newAccount":"حساب جديد","stats.downloads":"التحميلات","stats.times":"مرة تحميل","stats.clicks":"النقرات","stats.onApps":"على التطبيقات","stats.note":"أرقام تقريبية تبدأ من تفعيل العدّاد. الزائر الفريد يُحتسب مرة واحدة لكل متصفح، والمسجلون الجدد فقط.",
    "live.videos":"آخر الفيديوهات","live.live":"البث المباشر",    "live.noteVideos":"يعرض هذا القسم آخر فيديوهات القناة. عند بدء بث مباشر اختر «البث المباشر» أو افتح القناة على يوتيوب. إذا لم يظهر التشغيل داخل الموقع افتح القناة مباشرة.","live.noteLive":"إذا ظهر «غير متوفر» فهذا يعني أن القناة لا تبث الآن. افتح القناة على يوتيوب لمعرفة موعد البث القادم. إذا لم يظهر التشغيل داخل الموقع افتح القناة مباشرة.",
    "status.searching":"جارٍ البحث...","status.webSearching":"جارٍ البحث في الإنترنت...","status.searchEmpty":"اكتب كلمة للبحث أولًا","status.tokenMissing":"لم يتم إدخال التوكن، لم تُرفع الصور.","status.preparingUpload":"جارٍ تجهيز الصور ورفعها...","status.copyFail":"تعذّر نسخ الرابط","status.copied":"تم النسخ",
    "settings.langHelp":"اختر لغة واجهة الموقع (كل اللغات مدعومة). يتم الحفظ على هذا الجهاز.","settings.themeHelp":"اختر المظهر المناسب لك.","settings.soundHelp":"تحكم بأصوات النقر على الأزرار والروابط في الموقع.","settings.cacheHelp":"إذا لم تظهر التحديثات أو واجهت مشكلة، امسح كاش المتصفح وملفات Service Worker لهذا الموقع ثم أعد التحميل.","settings.hardReload":"تحديث قوي (بدون كاش)","settings.infoTitle":"معلومات","settings.versionLabel":"إصدار واجهة الموقع:","settings.galleryTitle":"معرض وأدوات سريعة",
    "apps.showing":"عرض","action.quickView":"نظرة سريعة","live.noteLive":"إذا ظهر \"غير متوفر\" فهذا يعني أن القناة لا تبث الآن. افتح القناة على يوتيوب لمعرفة موعد البث القادم.",
    "download.pageTitle":"صفحة التحميل","download.loading":"جارٍ تحميل بيانات التطبيق...","admin.title":"لوحة المالك","admin.gateTitle":"دخول خاص","admin.gateDesc":"هذه الصفحة خاصة بمالك الموقع. سجّل الدخول بحساب المالك لعرض الإحصائيات ورفع التطبيقات.","admin.logout":"تسجيل الخروج","admin.statsTitle":"إحصائيات مباشرة",
    "apps.allReleases":"كل الإصدارات على GitHub","apps.allReleasesShort":"كل الإصدارات","apps.requestActivate":"طلب التفعيل","apps.whatsappTopup":"واتساب الشحن","apps.empty":"لا توجد تطبيقات مطابقة لبحثك. جرّب كلمة أخرى أو اختر «الكل».","apps.noteLabel":"ملاحظة:","search.noGoogle":"بدون Google","search.engine":"محرك بحث","about.eyebrow":"عن المطور","contact.eyebrow":"كل مواقعي وطرق التواصل","services.eyebrow":"ماذا أقدم","live.eyebrow":"يوتيوب","live.openChannel":"فتح القناة على يوتيوب","nav.navigation":"التنقل","settings.themeChanged":"تم تغيير الثيم","settings.enabled":"مفعّلة","settings.disabled":"مكتومة","settings.soundUpdated":"تم تحديث إعداد الصوت","settings.clearing":"جارٍ مسح الكاش وملفات الخدمة...","settings.cleared":"تم مسح الكاش وملفات الخدمة (مع الاحتفاظ بـ GitHub Token المحفوظ). جارٍ إعادة التحميل...","settings.clearedToast":"تم مسح الكاش، سيُعاد تحميل الموقع","theme.dark":"ليلي","theme.light":"نهاري","theme.ocean":"محيطي","theme.emerald":"زمردي","theme.royal":"ملكي","theme.sunset":"غروب","theme.toNight":"التبديل إلى الوضع الليلي","theme.toDay":"التبديل إلى الوضع النهاري","theme.change":"تغيير ثيم الموقع","theme.themes":"ثيمات الموقع","audio.sfxMute":"كتم أصوات الأزرار","audio.sfxOn":"تشغيل أصوات الأزرار","audio.sfxEnabled":"أصوات الأزرار مفعّلة","audio.sfxDisabled":"أصوات الأزرار مكتومة","audio.sounds":"أصوات","audio.silent":"صامت","download.notFoundTitle":"التطبيق غير موجود","download.notFoundDesc":"لم نعثر على التطبيق المطلوب. يمكنك العودة إلى مكتبة التطبيقات واختيار تطبيق آخر.","download.showAll":"عرض كل التطبيقات","download.chooseTitle":"اختر تطبيقًا للتحميل","download.chooseDesc":"كل تطبيق له صفحة تحميل مستقلة مع زر رجوع سهل إلى الصفحة الرئيسية.","download.loginRequired":"التسجيل مطلوب قبل تحميل التطبيقات. أنشئ حسابًا أو سجّل الدخول عبر Firebase للمتابعة.","download.loggedInAs":"أنت مسجل الدخول باسم","download.ownerReady":"— مالك الموقع. التحميل جاهز.","download.ready":"التحميل جاهز.","download.logout":"تسجيل الخروج","download.register":"إنشاء حساب","download.login":"تسجيل الدخول","download.sha":"التحقق من SHA-256","download.detailsPage":"صفحة التفاصيل","download.noDesc":"لا يوجد وصف لهذا التطبيق.","download.activationTitle":"تفعيل التطبيق","download.activationNote":"بعد التثبيت افتح التطبيق وانسخ كود الجهاز، ثم أرسله عبر واتساب لطلب كود التفعيل.","download.activationRequest":"طلب كود التفعيل عبر واتساب","download.activationRequired":"يتطلب تفعيل","download.screenshotAlt":"لقطة شاشة","download.screenshotFail":"تعذّر عرض الصورة (قد تحتاج لنشر GitHub Pages أو تحديث الصفحة)","download.backApps":"عرض كل التطبيقات","admin.refresh":"تحديث الأرقام","admin.updating":"جارٍ التحديث...","admin.reading":"جارٍ قراءة الأرقام...","admin.lastUpdate":"آخر تحديث:","admin.loadFail":"تعذّر تحميل الإحصائيات. حاول مرة أخرى.","admin.noApps":"لا توجد تطبيقات بعد.","action.download":"تحميل","label.copyFail":"تعذّر نسخ الرابط","toast.copied":"تم النسخ","token.show":"إظهار التوكن","token.hide":"إخفاء التوكن","token.cleared":"تم مسح التوكن من هذا الجهاز."
  };

  var L = {
    ar: { _dir:"rtl", _lang:"ar", _name:"العربية" },
    en: { _dir:"ltr", _lang:"en", _name:"English",
      "menu.main":"Menu","menu.settings":"Settings & Languages","menu.quick":"Quick Links","menu.language":"Language","menu.theme":"Theme","menu.close":"Close","menu.sections":"Sections - Choose any place",
      "nav.home":"Home","nav.search":"Search","nav.apps":"Apps","nav.stats":"Stats","nav.clock":"Clock","nav.services":"Services","nav.live":"Live","nav.about":"About","nav.contact":"Contact","nav.settings":"Settings","nav.download":"Download","nav.admin":"Admin","nav.library":"Gallery & Library",
      "action.login":"Sign in","action.downloadApps":"Download Apps","action.browseApps":"Browse Apps","action.searchWeb":"Search the Web","action.contact":"Contact Me","action.shareSite":"Share Site","action.copyLink":"Copy Site Link","action.backHome":"Back to Home","action.allApps":"All Apps","action.search":"Search","action.backSite":"Back to Site","action.details":"Details","action.downloadApk":"Download APK","action.requestActivate":"Request activation",
      "hero.eyebrow":"Android Developer · Phone Diagnostics · Tech Tools","hero.lead":"I build practical Android apps and offline phone diagnostics tools focused on clarity and accuracy.","hero.muted":"From Raqqa, Syria. Apps include Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup, and a Magisk module.",
      "stats.apps":"Published Apps","stats.issues":"Issues in Encyclopedia","stats.offline":"Offline Tools",
      "section.stats":"Site in Numbers","section.search":"Search the Entire Web","section.apps":"Download My Apps","section.clock":"Syria Clock","section.services":"Development & Diagnostics","section.live":"Latest Videos & Live","section.about":"About Me","section.contact":"Contact Me","section.library":"Nature Images (Local + Google)","section.tech":"Tech Library & Solutions",
      "footer.rights":"Carefully built, running on GitHub Pages.","footer.admin":"Upload app","footer.settings":"Settings & clear cache",
      "settings.title":"Site Settings","settings.cache":"Clear Cache & Refresh","settings.cacheBtn":"Clear Cache and Reload","settings.cacheKeep":"This will not delete external accounts, only local cache/storage for this site (saved GitHub Token is kept).","settings.theme":"Site Theme","settings.sound":"Button Sounds","settings.info":"Info",
      "card.apps":"App Library","card.settings":"Site Settings","card.library":"Gallery & Library","card.contact":"Contact","card.download":"Download Page","card.admin":"Admin Panel","card.home":"Home Page",
      "filter.all":"All","filter.tools":"Tools","filter.islamic":"Islamic","filter.security":"Security","filter.games":"Games Topup","filter.diagnostics":"Diagnostics","filter.system":"System",
      "label.share":"Share:","label.copyLinkBtn":"Copy link","label.openSource":"Open original source","label.reading":"Read inside site","label.loadingPage":"Loading page...","label.addScreens":"Add screenshots","label.showToken":"Show token","label.hideToken":"Hide token","label.saveToken":"Save token",
      "ph.searchWeb":"Type what you want to search...","ph.searchApp":"Search by app name or description...",
      "status.webReady":"Full web search inside the site. Results appear here and you can read pages without leaving.",
      "404.title":"Page Not Found","404.desc":"The link may be old or the page has moved." },
    fr: { _dir:"ltr", _lang:"fr", _name:"Français",
      "menu.main":"Menu","menu.settings":"Paramètres et langues","menu.quick":"Liens rapides","menu.language":"Langue","menu.theme":"Thème","menu.close":"Fermer","menu.sections":"Sections - Choisir un endroit",
      "nav.home":"Accueil","nav.search":"Recherche","nav.apps":"Applications","nav.stats":"Chiffres","nav.clock":"Horloge","nav.services":"Services","nav.live":"Direct","nav.about":"À propos","nav.contact":"Contact","nav.settings":"Paramètres","nav.download":"Télécharger","nav.admin":"Admin","nav.library":"Galerie",
      "action.login":"Connexion","action.downloadApps":"Télécharger les apps","action.browseApps":"Parcourir les apps","action.searchWeb":"Rechercher sur le Web","action.contact":"Me contacter","action.shareSite":"Partager le site","action.copyLink":"Copier le lien","action.backHome":"Retour à l'accueil","action.allApps":"Toutes les apps","action.search":"Rechercher","action.backSite":"Retour au site","action.details":"Détails","action.downloadApk":"Télécharger APK","action.requestActivate":"Demander l'activation",
      "hero.eyebrow":"Développeur Android · Diagnostic · Outils techniques","hero.lead":"Je crée des applications Android pratiques et des outils de diagnostic hors ligne.","hero.muted":"De Raqqa, Syrie. Applications : Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup et module Magisk.",
      "stats.apps":"Apps publiées","stats.issues":"Pannes répertoriées","stats.offline":"Outils hors ligne",
      "section.stats":"Le site en chiffres","section.search":"Rechercher sur tout le Web","section.apps":"Téléchargez mes applications","section.clock":"Horloge de Syrie","section.services":"Développement et diagnostic","section.live":"Vidéos et direct","section.about":"À propos de moi","section.contact":"Contact","section.library":"Images de nature (Local + Google)","section.tech":"Bibliothèque technique",
      "footer.rights":"Conçu avec soin, hébergé sur GitHub Pages.","footer.admin":"Téléverser une app","footer.settings":"Paramètres et cache",
      "settings.title":"Paramètres du site","settings.cache":"Vider le cache","settings.cacheBtn":"Vider le cache et recharger","settings.cacheKeep":"Ne supprime pas vos comptes externes, seulement le cache local (le token GitHub est conservé).","settings.theme":"Thème du site","settings.sound":"Sons des boutons","settings.info":"Infos",
      "card.apps":"Bibliothèque d'apps","card.settings":"Paramètres","card.library":"Galerie","card.contact":"Contact","card.download":"Page de téléchargement","card.admin":"Panneau admin","card.home":"Accueil",
      "filter.all":"Tout","filter.tools":"Outils","filter.islamic":"Islamique","filter.security":"Sécurité","filter.games":"Jeux","filter.diagnostics":"Diagnostic","filter.system":"Système",
      "label.share":"Partager :","label.copyLinkBtn":"Copier le lien","label.openSource":"Ouvrir la source","label.reading":"Lecture sur le site","label.loadingPage":"Chargement...","label.addScreens":"Ajouter captures","label.showToken":"Afficher token","label.hideToken":"Masquer token","label.saveToken":"Enregistrer token",
      "ph.searchWeb":"Tapez votre recherche...","ph.searchApp":"Rechercher une app...",
      "status.webReady":"Recherche Web complète sur le site. Les résultats s'affichent ici.",
      "404.title":"Page introuvable","404.desc":"Le lien est peut-être ancien ou la page a été déplacée." },
    es: { _dir:"ltr", _lang:"es", _name:"Español",
      "menu.main":"Menú","menu.settings":"Ajustes e idiomas","menu.quick":"Enlaces rápidos","menu.language":"Idioma","menu.theme":"Tema","menu.close":"Cerrar","menu.sections":"Secciones - Elige cualquier lugar",
      "nav.home":"Inicio","nav.search":"Buscar","nav.apps":"Aplicaciones","nav.stats":"Números","nav.clock":"Reloj","nav.services":"Servicios","nav.live":"En vivo","nav.about":"Sobre mí","nav.contact":"Contacto","nav.settings":"Ajustes","nav.download":"Descargar","nav.admin":"Admin","nav.library":"Galería",
      "action.login":"Iniciar sesión","action.downloadApps":"Descargar apps","action.browseApps":"Ver aplicaciones","action.searchWeb":"Buscar en la web","action.contact":"Contáctame","action.shareSite":"Compartir sitio","action.copyLink":"Copiar enlace","action.backHome":"Volver al inicio","action.allApps":"Todas las apps","action.search":"Buscar","action.backSite":"Volver al sitio","action.details":"Detalles","action.downloadApk":"Descargar APK","action.requestActivate":"Solicitar activación",
      "hero.eyebrow":"Desarrollador Android · Diagnóstico · Herramientas","hero.lead":"Creo aplicaciones Android prácticas y herramientas de diagnóstico sin conexión.","hero.muted":"De Raqa, Siria. Apps: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup y módulo Magisk.",
      "stats.apps":"Apps publicadas","stats.issues":"Fallos en enciclopedia","stats.offline":"Herramientas offline",
      "section.stats":"El sitio en números","section.search":"Busca en toda la web","section.apps":"Descarga mis aplicaciones","section.clock":"Reloj de Siria","section.services":"Desarrollo y diagnóstico","section.live":"Vídeos y directo","section.about":"Sobre mí","section.contact":"Contacto","section.library":"Imágenes de naturaleza (Local + Google)","section.tech":"Biblioteca técnica",
      "footer.rights":"Hecho con cuidado, alojado en GitHub Pages.","footer.admin":"Subir app","footer.settings":"Ajustes y caché",
      "settings.title":"Ajustes del sitio","settings.cache":"Borrar caché","settings.cacheBtn":"Borrar caché y recargar","settings.cacheKeep":"No borra cuentas externas, solo caché local (se conserva el token de GitHub).","settings.theme":"Tema del sitio","settings.sound":"Sonidos de botones","settings.info":"Info",
      "card.apps":"Biblioteca de apps","card.settings":"Ajustes","card.library":"Galería","card.contact":"Contacto","card.download":"Página de descarga","card.admin":"Panel admin","card.home":"Inicio",
      "filter.all":"Todo","filter.tools":"Herramientas","filter.islamic":"Islámico","filter.security":"Seguridad","filter.games":"Juegos","filter.diagnostics":"Diagnóstico","filter.system":"Sistema",
      "label.share":"Compartir:","label.copyLinkBtn":"Copiar enlace","label.openSource":"Abrir fuente original","label.reading":"Lectura en el sitio","label.loadingPage":"Cargando...","label.addScreens":"Añadir capturas","label.showToken":"Mostrar token","label.hideToken":"Ocultar token","label.saveToken":"Guardar token",
      "ph.searchWeb":"Escribe lo que quieres buscar...","ph.searchApp":"Buscar app por nombre o descripción...",
      "status.webReady":"Búsqueda web completa en el sitio. Los resultados aparecen aquí.",
      "404.title":"Página no encontrada","404.desc":"El enlace puede ser antiguo o la página se ha movido." },
    de: { _dir:"ltr", _lang:"de", _name:"Deutsch",
      "menu.main":"Menü","menu.settings":"Einstellungen & Sprachen","menu.quick":"Schnelllinks","menu.language":"Sprache","menu.theme":"Design","menu.close":"Schließen","menu.sections":"Bereiche - Ort wählen",
      "nav.home":"Start","nav.search":"Suche","nav.apps":"Apps","nav.stats":"Zahlen","nav.clock":"Uhr","nav.services":"Dienste","nav.live":"Live","nav.about":"Über mich","nav.contact":"Kontakt","nav.settings":"Einstellungen","nav.download":"Download","nav.admin":"Admin","nav.library":"Galerie",
      "action.login":"Anmelden","action.downloadApps":"Apps herunterladen","action.browseApps":"Apps durchsuchen","action.searchWeb":"Im Web suchen","action.contact":"Kontakt","action.shareSite":"Seite teilen","action.copyLink":"Link kopieren","action.backHome":"Zur Startseite","action.allApps":"Alle Apps","action.search":"Suchen","action.backSite":"Zurück","action.details":"Details","action.downloadApk":"APK herunterladen","action.requestActivate":"Aktivierung anfragen",
      "hero.eyebrow":"Android-Entwickler · Handy-Diagnose · Tools","hero.lead":"Ich entwickle praktische Android-Apps und Offline-Diagnosetools.","hero.muted":"Aus Rakka, Syrien. Apps: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup und Magisk-Modul.",
      "stats.apps":"Veröffentlichte Apps","stats.issues":"Fehler in Enzyklopädie","stats.offline":"Offline-Tools",
      "section.stats":"Seite in Zahlen","section.search":"Das ganze Web durchsuchen","section.apps":"Meine Apps herunterladen","section.clock":"Syrien-Uhr","section.services":"Entwicklung & Diagnose","section.live":"Videos & Live","section.about":"Über mich","section.contact":"Kontakt","section.library":"Naturbilder (Lokal + Google)","section.tech":"Technik-Bibliothek",
      "footer.rights":"Sorgfältig erstellt, auf GitHub Pages.","footer.admin":"App hochladen","footer.settings":"Einstellungen & Cache",
      "settings.title":"Website-Einstellungen","settings.cache":"Cache leeren","settings.cacheBtn":"Cache leeren und neu laden","settings.cacheKeep":"Externe Konten bleiben erhalten, nur lokaler Cache (GitHub-Token bleibt gespeichert).","settings.theme":"Design","settings.sound":"Button-Töne","settings.info":"Info",
      "card.apps":"App-Bibliothek","card.settings":"Einstellungen","card.library":"Galerie","card.contact":"Kontakt","card.download":"Download-Seite","card.admin":"Admin-Bereich","card.home":"Startseite",
      "filter.all":"Alle","filter.tools":"Tools","filter.islamic":"Islamisch","filter.security":"Sicherheit","filter.games":"Spiele","filter.diagnostics":"Diagnose","filter.system":"System",
      "label.share":"Teilen:","label.copyLinkBtn":"Link kopieren","label.openSource":"Originalquelle öffnen","label.reading":"Im Site lesen","label.loadingPage":"Laden...","label.addScreens":"Screenshots hinzufügen","label.showToken":"Token anzeigen","label.hideToken":"Token verbergen","label.saveToken":"Token speichern",
      "ph.searchWeb":"Suchbegriff eingeben...","ph.searchApp":"App suchen...",
      "status.webReady":"Vollständige Websuche auf der Seite. Ergebnisse erscheinen hier.",
      "404.title":"Seite nicht gefunden","404.desc":"Der Link ist möglicherweise veraltet oder die Seite wurde verschoben." },
    tr: { _dir:"ltr", _lang:"tr", _name:"Türkçe",
      "menu.main":"Menü","menu.settings":"Ayarlar ve Diller","menu.quick":"Hızlı Bağlantılar","menu.language":"Dil","menu.theme":"Tema","menu.close":"Kapat","menu.sections":"Bölümler - Herhangi bir yer seç",
      "nav.home":"Ana Sayfa","nav.search":"Ara","nav.apps":"Uygulamalar","nav.stats":"Sayılar","nav.clock":"Saat","nav.services":"Hizmetler","nav.live":"Canlı","nav.about":"Hakkımda","nav.contact":"İletişim","nav.settings":"Ayarlar","nav.download":"İndir","nav.admin":"Yönetici","nav.library":"Galeri",
      "action.login":"Giriş yap","action.downloadApps":"Uygulamaları indir","action.browseApps":"Uygulamalara göz at","action.searchWeb":"Web'de ara","action.contact":"Bana ulaş","action.shareSite":"Siteyi paylaş","action.copyLink":"Bağlantıyı kopyala","action.backHome":"Ana sayfaya dön","action.allApps":"Tüm uygulamalar","action.search":"Ara","action.backSite":"Siteye dön","action.details":"Detaylar","action.downloadApk":"APK indir","action.requestActivate":"Etkinleştirme iste",
      "hero.eyebrow":"Android Geliştirici · Telefon Teşhisi · Araçlar","hero.lead":"Pratik Android uygulamaları ve çevrimdışı telefon teşhis araçları geliştiriyorum.","hero.muted":"Rakka, Suriye. Uygulamalar: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup ve Magisk modülü.",
      "stats.apps":"Yayınlanan Uygulama","stats.issues":"Ansiklopedideki Arıza","stats.offline":"Çevrimdışı Araç",
      "section.stats":"Sayılarla Site","section.search":"Tüm Web'de Ara","section.apps":"Uygulamalarımı İndir","section.clock":"Suriye Saati","section.services":"Geliştirme ve Teşhis","section.live":"Videolar ve Canlı","section.about":"Hakkımda","section.contact":"İletişim","section.library":"Doğa Görselleri (Yerel + Google)","section.tech":"Teknik Kütüphane",
      "footer.rights":"Özenle hazırlandı, GitHub Pages üzerinde.","footer.admin":"Uygulama yükle","footer.settings":"Ayarlar ve önbellek",
      "settings.title":"Site Ayarları","settings.cache":"Önbelleği Temizle","settings.cacheBtn":"Önbelleği Temizle ve Yeniden Yükle","settings.cacheKeep":"Harici hesapları silmez, yalnızca yerel önbellek (GitHub Token korunur).","settings.theme":"Site Teması","settings.sound":"Düğme Sesleri","settings.info":"Bilgi",
      "card.apps":"Uygulama Kütüphanesi","card.settings":"Site Ayarları","card.library":"Galeri","card.contact":"İletişim","card.download":"İndirme Sayfası","card.admin":"Yönetici Paneli","card.home":"Ana Sayfa",
      "filter.all":"Tümü","filter.tools":"Araçlar","filter.islamic":"İslami","filter.security":"Güvenlik","filter.games":"Oyunlar","filter.diagnostics":"Teşhis","filter.system":"Sistem",
      "label.share":"Paylaş:","label.copyLinkBtn":"Bağlantıyı kopyala","label.openSource":"Kaynağı aç","label.reading":"Sitede oku","label.loadingPage":"Yükleniyor...","label.addScreens":"Ekran görüntüsü ekle","label.showToken":"Token göster","label.hideToken":"Token gizle","label.saveToken":"Token kaydet",
      "ph.searchWeb":"Aramak istediğinizi yazın...","ph.searchApp":"Uygulama ara...",
      "status.webReady":"Site içinde tam web araması. Sonuçlar burada görünür.",
      "404.title":"Sayfa Bulunamadı","404.desc":"Bağlantı eski olabilir veya sayfa taşınmış olabilir." },
    ru: { _dir:"ltr", _lang:"ru", _name:"Русский",
      "menu.main":"Меню","menu.settings":"Настройки и языки","menu.quick":"Быстрые ссылки","menu.language":"Язык","menu.theme":"Тема","menu.close":"Закрыть","menu.sections":"Разделы - Выберите место",
      "nav.home":"Главная","nav.search":"Поиск","nav.apps":"Приложения","nav.stats":"Цифры","nav.clock":"Часы","nav.services":"Услуги","nav.live":"Эфир","nav.about":"Обо мне","nav.contact":"Контакты","nav.settings":"Настройки","nav.download":"Скачать","nav.admin":"Админ","nav.library":"Галерея",
      "action.login":"Войти","action.downloadApps":"Скачать приложения","action.browseApps":"Обзор приложений","action.searchWeb":"Искать в интернете","action.contact":"Связаться","action.shareSite":"Поделиться сайтом","action.copyLink":"Копировать ссылку","action.backHome":"На главную","action.allApps":"Все приложения","action.search":"Поиск","action.backSite":"Назад на сайт","action.details":"Подробнее","action.downloadApk":"Скачать APK","action.requestActivate":"Запросить активацию",
      "hero.eyebrow":"Разработчик Android · Диагностика · Инструменты","hero.lead":"Создаю практичные Android-приложения и офлайн-инструменты диагностики телефонов.","hero.muted":"Из Ракки, Сирия. Приложения: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup и модуль Magisk.",
      "stats.apps":"Опубликовано приложений","stats.issues":"Неисправностей в базе","stats.offline":"Офлайн-инструменты",
      "section.stats":"Сайт в цифрах","section.search":"Поиск по всему интернету","section.apps":"Скачать мои приложения","section.clock":"Часы Сирии","section.services":"Разработка и диагностика","section.live":"Видео и трансляция","section.about":"Обо мне","section.contact":"Контакты","section.library":"Природа (локально + Google)","section.tech":"Техническая библиотека",
      "footer.rights":"Сделано с заботой, работает на GitHub Pages.","footer.admin":"Загрузить приложение","footer.settings":"Настройки и кэш",
      "settings.title":"Настройки сайта","settings.cache":"Очистить кэш","settings.cacheBtn":"Очистить кэш и перезагрузить","settings.cacheKeep":"Внешние аккаунты не удаляются, только локальный кэш (сохранённый GitHub Token остаётся).","settings.theme":"Тема сайта","settings.sound":"Звуки кнопок","settings.info":"Информация",
      "card.apps":"Библиотека приложений","card.settings":"Настройки","card.library":"Галерея","card.contact":"Контакты","card.download":"Страница загрузки","card.admin":"Панель администратора","card.home":"Главная",
      "filter.all":"Все","filter.tools":"Инструменты","filter.islamic":"Ислам","filter.security":"Безопасность","filter.games":"Игры","filter.diagnostics":"Диагностика","filter.system":"Система",
      "label.share":"Поделиться:","label.copyLinkBtn":"Копировать ссылку","label.openSource":"Открыть источник","label.reading":"Чтение на сайте","label.loadingPage":"Загрузка...","label.addScreens":"Добавить скриншоты","label.showToken":"Показать токен","label.hideToken":"Скрыть токен","label.saveToken":"Сохранить токен",
      "ph.searchWeb":"Введите запрос...","ph.searchApp":"Поиск приложения...",
      "status.webReady":"Полный веб-поиск на сайте. Результаты появятся здесь.",
      "404.title":"Страница не найдена","404.desc":"Ссылка может быть устаревшей или страница перемещена." },
    pt: { _dir:"ltr", _lang:"pt", _name:"Português",
      "menu.main":"Menu","menu.settings":"Configurações e idiomas","menu.quick":"Links rápidos","menu.language":"Idioma","menu.theme":"Tema","menu.close":"Fechar","menu.sections":"Seções - Escolha um lugar",
      "nav.home":"Início","nav.search":"Pesquisar","nav.apps":"Aplicativos","nav.stats":"Números","nav.clock":"Relógio","nav.services":"Serviços","nav.live":"Ao vivo","nav.about":"Sobre","nav.contact":"Contato","nav.settings":"Configurações","nav.download":"Baixar","nav.admin":"Admin","nav.library":"Galeria",
      "action.login":"Entrar","action.downloadApps":"Baixar apps","action.browseApps":"Ver aplicativos","action.searchWeb":"Pesquisar na web","action.contact":"Fale comigo","action.shareSite":"Compartilhar site","action.copyLink":"Copiar link","action.backHome":"Voltar ao início","action.allApps":"Todos os apps","action.search":"Pesquisar","action.backSite":"Voltar ao site","action.details":"Detalhes","action.downloadApk":"Baixar APK","action.requestActivate":"Solicitar ativação",
      "hero.eyebrow":"Desenvolvedor Android · Diagnóstico · Ferramentas","hero.lead":"Crio aplicativos Android práticos e ferramentas de diagnóstico offline.","hero.muted":"De Raqqa, Síria. Apps: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup e módulo Magisk.",
      "stats.apps":"Apps publicados","stats.issues":"Problemas na enciclopédia","stats.offline":"Ferramentas offline",
      "section.stats":"Site em números","section.search":"Pesquisar em toda a web","section.apps":"Baixe meus aplicativos","section.clock":"Relógio da Síria","section.services":"Desenvolvimento e diagnóstico","section.live":"Vídeos e ao vivo","section.about":"Sobre mim","section.contact":"Contato","section.library":"Imagens da natureza (Local + Google)","section.tech":"Biblioteca técnica",
      "footer.rights":"Feito com cuidado, hospedado no GitHub Pages.","footer.admin":"Enviar app","footer.settings":"Configurações e cache",
      "settings.title":"Configurações do site","settings.cache":"Limpar cache","settings.cacheBtn":"Limpar cache e recarregar","settings.cacheKeep":"Não remove contas externas, apenas cache local (token do GitHub é mantido).","settings.theme":"Tema do site","settings.sound":"Sons dos botões","settings.info":"Info",
      "card.apps":"Biblioteca de apps","card.settings":"Configurações","card.library":"Galeria","card.contact":"Contato","card.download":"Página de download","card.admin":"Painel admin","card.home":"Início",
      "filter.all":"Todos","filter.tools":"Ferramentas","filter.islamic":"Islâmico","filter.security":"Segurança","filter.games":"Jogos","filter.diagnostics":"Diagnóstico","filter.system":"Sistema",
      "label.share":"Compartilhar:","label.copyLinkBtn":"Copiar link","label.openSource":"Abrir fonte original","label.reading":"Ler no site","label.loadingPage":"Carregando...","label.addScreens":"Adicionar capturas","label.showToken":"Mostrar token","label.hideToken":"Ocultar token","label.saveToken":"Salvar token",
      "ph.searchWeb":"Digite o que deseja buscar...","ph.searchApp":"Buscar app...",
      "status.webReady":"Pesquisa completa na web dentro do site. Os resultados aparecem aqui.",
      "404.title":"Página não encontrada","404.desc":"O link pode estar antigo ou a página foi movida." },
    it: { _dir:"ltr", _lang:"it", _name:"Italiano",
      "menu.main":"Menu","menu.settings":"Impostazioni e lingue","menu.quick":"Link rapidi","menu.language":"Lingua","menu.theme":"Tema","menu.close":"Chiudi","menu.sections":"Sezioni - Scegli un posto",
      "nav.home":"Home","nav.search":"Cerca","nav.apps":"App","nav.stats":"Numeri","nav.clock":"Orologio","nav.services":"Servizi","nav.live":"Live","nav.about":"Chi sono","nav.contact":"Contatto","nav.settings":"Impostazioni","nav.download":"Download","nav.admin":"Admin","nav.library":"Galleria",
      "action.login":"Accedi","action.downloadApps":"Scarica app","action.browseApps":"Sfoglia app","action.searchWeb":"Cerca nel web","action.contact":"Contattami","action.shareSite":"Condividi sito","action.copyLink":"Copia link","action.backHome":"Torna alla home","action.allApps":"Tutte le app","action.search":"Cerca","action.backSite":"Torna al sito","action.details":"Dettagli","action.downloadApk":"Scarica APK","action.requestActivate":"Richiedi attivazione",
      "hero.eyebrow":"Sviluppatore Android · Diagnostica · Strumenti","hero.lead":"Creo app Android pratiche e strumenti di diagnostica offline.","hero.muted":"Da Raqqa, Siria. App: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup e modulo Magisk.",
      "stats.apps":"App pubblicate","stats.issues":"Problemi in enciclopedia","stats.offline":"Strumenti offline",
      "section.stats":"Il sito in numeri","section.search":"Cerca in tutto il web","section.apps":"Scarica le mie app","section.clock":"Orologio Siria","section.services":"Sviluppo e diagnostica","section.live":"Video e live","section.about":"Chi sono","section.contact":"Contatto","section.library":"Immagini natura (Locale + Google)","section.tech":"Libreria tecnica",
      "footer.rights":"Realizzato con cura, su GitHub Pages.","footer.admin":"Carica app","footer.settings":"Impostazioni e cache",
      "settings.title":"Impostazioni sito","settings.cache":"Svuota cache","settings.cacheBtn":"Svuota cache e ricarica","settings.cacheKeep":"Non elimina account esterni, solo cache locale (il token GitHub viene mantenuto).","settings.theme":"Tema del sito","settings.sound":"Suoni pulsanti","settings.info":"Info",
      "card.apps":"Libreria app","card.settings":"Impostazioni","card.library":"Galleria","card.contact":"Contatto","card.download":"Pagina download","card.admin":"Pannello admin","card.home":"Home",
      "filter.all":"Tutti","filter.tools":"Strumenti","filter.islamic":"Islamico","filter.security":"Sicurezza","filter.games":"Giochi","filter.diagnostics":"Diagnostica","filter.system":"Sistema",
      "label.share":"Condividi:","label.copyLinkBtn":"Copia link","label.openSource":"Apri fonte originale","label.reading":"Leggi nel sito","label.loadingPage":"Caricamento...","label.addScreens":"Aggiungi screenshot","label.showToken":"Mostra token","label.hideToken":"Nascondi token","label.saveToken":"Salva token",
      "ph.searchWeb":"Scrivi cosa vuoi cercare...","ph.searchApp":"Cerca app...",
      "status.webReady":"Ricerca web completa nel sito. I risultati appaiono qui.",
      "404.title":"Pagina non trovata","404.desc":"Il link potrebbe essere vecchio o la pagina è stata spostata." },
    nl: { _dir:"ltr", _lang:"nl", _name:"Nederlands",
      "menu.main":"Menu","menu.settings":"Instellingen & talen","menu.quick":"Snelle links","menu.language":"Taal","menu.theme":"Thema","menu.close":"Sluiten","menu.sections":"Secties - Kies een plek",
      "nav.home":"Home","nav.search":"Zoeken","nav.apps":"Apps","nav.stats":"Cijfers","nav.clock":"Klok","nav.services":"Diensten","nav.live":"Live","nav.about":"Over mij","nav.contact":"Contact","nav.settings":"Instellingen","nav.download":"Download","nav.admin":"Beheer","nav.library":"Galerij",
      "action.login":"Inloggen","action.downloadApps":"Apps downloaden","action.browseApps":"Apps bekijken","action.searchWeb":"Zoek op het web","action.contact":"Contact","action.shareSite":"Site delen","action.copyLink":"Link kopiëren","action.backHome":"Terug naar home","action.allApps":"Alle apps","action.search":"Zoeken","action.backSite":"Terug naar site","action.details":"Details","action.downloadApk":"APK downloaden","action.requestActivate":"Activatie aanvragen",
      "hero.eyebrow":"Android-ontwikkelaar · Telefoondiagnose · Tools","hero.lead":"Ik bouw praktische Android-apps en offline diagnosetools.","hero.muted":"Uit Raqqa, Syrië. Apps: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup en Magisk-module.",
      "stats.apps":"Gepubliceerde apps","stats.issues":"Problemen in encyclopedie","stats.offline":"Offline tools",
      "section.stats":"Site in cijfers","section.search":"Zoek op het hele web","section.apps":"Download mijn apps","section.clock":"Syrië-klok","section.services":"Ontwikkeling & diagnose","section.live":"Video's & live","section.about":"Over mij","section.contact":"Contact","section.library":"Natuurbeelden (Lokaal + Google)","section.tech":"Technische bibliotheek",
      "footer.rights":"Zorgvuldig gemaakt, op GitHub Pages.","footer.admin":"App uploaden","footer.settings":"Instellingen & cache",
      "settings.title":"Site-instellingen","settings.cache":"Cache wissen","settings.cacheBtn":"Cache wissen en herladen","settings.cacheKeep":"Externe accounts blijven behouden, alleen lokale cache (GitHub-token blijft bewaard).","settings.theme":"Site-thema","settings.sound":"Knopgeluiden","settings.info":"Info",
      "card.apps":"App-bibliotheek","card.settings":"Instellingen","card.library":"Galerij","card.contact":"Contact","card.download":"Downloadpagina","card.admin":"Beheerpaneel","card.home":"Home",
      "filter.all":"Alles","filter.tools":"Tools","filter.islamic":"Islamitisch","filter.security":"Beveiliging","filter.games":"Games","filter.diagnostics":"Diagnose","filter.system":"Systeem",
      "label.share":"Delen:","label.copyLinkBtn":"Link kopiëren","label.openSource":"Bron openen","label.reading":"Lezen op site","label.loadingPage":"Laden...","label.addScreens":"Screenshots toevoegen","label.showToken":"Token tonen","label.hideToken":"Token verbergen","label.saveToken":"Token opslaan",
      "ph.searchWeb":"Typ je zoekopdracht...","ph.searchApp":"Zoek app...",
      "status.webReady":"Volledige webzoekfunctie op de site. Resultaten verschijnen hier.",
      "404.title":"Pagina niet gevonden","404.desc":"De link kan oud zijn of de pagina is verplaatst." },
    id: { _dir:"ltr", _lang:"id", _name:"Bahasa Indonesia",
      "menu.main":"Menu","menu.settings":"Pengaturan & Bahasa","menu.quick":"Tautan cepat","menu.language":"Bahasa","menu.theme":"Tema","menu.close":"Tutup","menu.sections":"Bagian - Pilih tempat mana saja",
      "nav.home":"Beranda","nav.search":"Cari","nav.apps":"Aplikasi","nav.stats":"Angka","nav.clock":"Jam","nav.services":"Layanan","nav.live":"Live","nav.about":"Tentang","nav.contact":"Kontak","nav.settings":"Pengaturan","nav.download":"Unduh","nav.admin":"Admin","nav.library":"Galeri",
      "action.login":"Masuk","action.downloadApps":"Unduh aplikasi","action.browseApps":"Jelajahi aplikasi","action.searchWeb":"Cari di web","action.contact":"Hubungi saya","action.shareSite":"Bagikan situs","action.copyLink":"Salin tautan","action.backHome":"Kembali ke beranda","action.allApps":"Semua aplikasi","action.search":"Cari","action.backSite":"Kembali ke situs","action.details":"Detail","action.downloadApk":"Unduh APK","action.requestActivate":"Minta aktivasi",
      "hero.eyebrow":"Pengembang Android · Diagnostik Ponsel · Alat","hero.lead":"Saya membuat aplikasi Android praktis dan alat diagnostik ponsel offline.","hero.muted":"Dari Raqqa, Suriah. Aplikasi: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup, dan modul Magisk.",
      "stats.apps":"Aplikasi diterbitkan","stats.issues":"Masalah di ensiklopedia","stats.offline":"Alat offline",
      "section.stats":"Situs dalam angka","section.search":"Cari di seluruh web","section.apps":"Unduh aplikasi saya","section.clock":"Jam Suriah","section.services":"Pengembangan & diagnostik","section.live":"Video & siaran langsung","section.about":"Tentang saya","section.contact":"Kontak","section.library":"Gambar alam (Lokal + Google)","section.tech":"Perpustakaan teknis",
      "footer.rights":"Dibuat dengan hati-hati, berjalan di GitHub Pages.","footer.admin":"Unggah aplikasi","footer.settings":"Pengaturan & cache",
      "settings.title":"Pengaturan Situs","settings.cache":"Hapus cache","settings.cacheBtn":"Hapus cache dan muat ulang","settings.cacheKeep":"Tidak menghapus akun eksternal, hanya cache lokal (token GitHub tersimpan).","settings.theme":"Tema situs","settings.sound":"Suara tombol","settings.info":"Info",
      "card.apps":"Perpustakaan aplikasi","card.settings":"Pengaturan","card.library":"Galeri","card.contact":"Kontak","card.download":"Halaman unduh","card.admin":"Panel admin","card.home":"Beranda",
      "filter.all":"Semua","filter.tools":"Alat","filter.islamic":"Islami","filter.security":"Keamanan","filter.games":"Game","filter.diagnostics":"Diagnostik","filter.system":"Sistem",
      "label.share":"Bagikan:","label.copyLinkBtn":"Salin tautan","label.openSource":"Buka sumber asli","label.reading":"Baca di situs","label.loadingPage":"Memuat...","label.addScreens":"Tambah tangkapan layar","label.showToken":"Tampilkan token","label.hideToken":"Sembunyikan token","label.saveToken":"Simpan token",
      "ph.searchWeb":"Ketik yang ingin dicari...","ph.searchApp":"Cari aplikasi...",
      "status.webReady":"Pencarian web lengkap di dalam situs. Hasil muncul di sini.",
      "404.title":"Halaman tidak ditemukan","404.desc":"Tautan mungkin lama atau halaman telah dipindahkan." },
    hi: { _dir:"ltr", _lang:"hi", _name:"हिन्दी",
      "menu.main":"मेनू","menu.settings":"सेटिंग्स और भाषाएँ","menu.quick":"त्वरित लिंक","menu.language":"भाषा","menu.theme":"थीम","menu.close":"बंद करें","menu.sections":"अनुभाग - कोई भी स्थान चुनें",
      "nav.home":"होम","nav.search":"खोज","nav.apps":"ऐप्स","nav.stats":"आंकड़े","nav.clock":"घड़ी","nav.services":"सेवाएँ","nav.live":"लाइव","nav.about":"मेरे बारे में","nav.contact":"संपर्क","nav.settings":"सेटिंग्स","nav.download":"डाउनलोड","nav.admin":"एडमिन","nav.library":"गैलरी",
      "action.login":"साइन इन","action.downloadApps":"ऐप्स डाउनलोड करें","action.browseApps":"ऐप्स देखें","action.searchWeb":"वेब पर खोजें","action.contact":"संपर्क करें","action.shareSite":"साइट साझा करें","action.copyLink":"लिंक कॉपी करें","action.backHome":"होम पर वापस","action.allApps":"सभी ऐप्स","action.search":"खोजें","action.backSite":"साइट पर वापस","action.details":"विवरण","action.downloadApk":"APK डाउनलोड","action.requestActivate":"सक्रियण अनुरोध",
      "hero.eyebrow":"Android डेवलपर · फोन डायग्नोस्टिक्स · टूल्स","hero.lead":"मैं व्यावहारिक Android ऐप्स और ऑफ़लाइन फोन डायग्नोस्टिक टूल बनाता हूँ।","hero.muted":"रक्का, सीरिया से। ऐप्स: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup और Magisk मॉड्यूल।",
      "stats.apps":"प्रकाशित ऐप्स","stats.issues":"विश्वकोश में समस्याएँ","stats.offline":"ऑफ़लाइन टूल्स",
      "section.stats":"आंकड़ों में साइट","section.search":"पूरे वेब में खोजें","section.apps":"मेरे ऐप्स डाउनलोड करें","section.clock":"सीरिया घड़ी","section.services":"विकास और डायग्नोस्टिक्स","section.live":"वीडियो और लाइव","section.about":"मेरे बारे में","section.contact":"संपर्क","section.library":"प्रकृति चित्र (लोकल + Google)","section.tech":"तकनीकी लाइब्रेरी",
      "footer.rights":"सावधानी से बनाया गया, GitHub Pages पर।","footer.admin":"ऐप अपलोड करें","footer.settings":"सेटिंग्स और कैश",
      "settings.title":"साइट सेटिंग्स","settings.cache":"कैश साफ़ करें","settings.cacheBtn":"कैश साफ़ करें और रीलोड करें","settings.cacheKeep":"बाहरी खाते नहीं हटेंगे, केवल लोकल कैश (GitHub टोकन सुरक्षित रहेगा)।","settings.theme":"साइट थीम","settings.sound":"बटन ध्वनियाँ","settings.info":"जानकारी",
      "card.apps":"ऐप लाइब्रेरी","card.settings":"साइट सेटिंग्स","card.library":"गैलरी","card.contact":"संपर्क","card.download":"डाउनलोड पेज","card.admin":"एडमिन पैनल","card.home":"होम पेज",
      "filter.all":"सभी","filter.tools":"टूल्स","filter.islamic":"इस्लामी","filter.security":"सुरक्षा","filter.games":"गेम्स","filter.diagnostics":"डायग्नोस्टिक्स","filter.system":"सिस्टम",
      "label.share":"साझा करें:","label.copyLinkBtn":"लिंक कॉपी करें","label.openSource":"मूल स्रोत खोलें","label.reading":"साइट में पढ़ें","label.loadingPage":"लोड हो रहा है...","label.addScreens":"स्क्रीनशॉट जोड़ें","label.showToken":"टोकन दिखाएँ","label.hideToken":"टोकन छिपाएँ","label.saveToken":"टोकन सहेजें",
      "ph.searchWeb":"खोजने के लिए लिखें...","ph.searchApp":"ऐप खोजें...",
      "status.webReady":"साइट के अंदर पूर्ण वेब खोज। परिणाम यहाँ दिखेंगे।",
      "404.title":"पेज नहीं मिला","404.desc":"लिंक पुराना हो सकता है या पेज स्थानांतरित हो गया है।" },
    ur: { _dir:"rtl", _lang:"ur", _name:"اردو",
      "menu.main":"مینو","menu.settings":"ترتیبات اور زبانیں","menu.quick":"فوری روابط","menu.language":"زبان","menu.theme":"تھیم","menu.close":"بند کریں","menu.sections":"حصے - کوئی بھی جگہ منتخب کریں",
      "nav.home":"ہوم","nav.search":"تلاش","nav.apps":"ایپس","nav.stats":"اعداد","nav.clock":"گھڑی","nav.services":"خدمات","nav.live":"لائیو","nav.about":"میرے بارے میں","nav.contact":"رابطہ","nav.settings":"ترتیبات","nav.download":"ڈاؤن لوڈ","nav.admin":"ایڈمن","nav.library":"گیلری",
      "action.login":"سائن ان","action.downloadApps":"ایپس ڈاؤن لوڈ کریں","action.browseApps":"ایپس دیکھیں","action.searchWeb":"ویب پر تلاش کریں","action.contact":"رابطہ کریں","action.shareSite":"سائٹ شیئر کریں","action.copyLink":"لنک کاپی کریں","action.backHome":"ہوم پر واپس","action.allApps":"تمام ایپس","action.search":"تلاش","action.backSite":"سائٹ پر واپس","action.details":"تفصیلات","action.downloadApk":"APK ڈاؤن لوڈ","action.requestActivate":"فعالیت کی درخواست",
      "hero.eyebrow":"اینڈرائیڈ ڈویلپر · فون تشخیص · ٹولز","hero.lead":"میں عملی اینڈرائیڈ ایپس اور آف لائن فون تشخیصی ٹولز بناتا ہوں۔","hero.muted":"رقہ، شام سے۔ ایپس: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup اور Magisk ماڈیول۔",
      "stats.apps":"شائع شدہ ایپس","stats.issues":"انسائیکلوپیڈیا میں خرابیاں","stats.offline":"آف لائن ٹولز",
      "section.stats":"اعداد و شمار میں سائٹ","section.search":"پورے ویب پر تلاش کریں","section.apps":"میری ایپس ڈاؤن لوڈ کریں","section.clock":"شام کی گھڑی","section.services":"ترقی اور تشخیص","section.live":"ویڈیوز اور لائیو","section.about":"میرے بارے میں","section.contact":"رابطہ","section.library":"قدرتی تصاویر (لوکل + Google)","section.tech":"تکنیکی لائبریری",
      "footer.rights":"احتیاط سے بنایا گیا، GitHub Pages پر۔","footer.admin":"ایپ اپ لوڈ کریں","footer.settings":"ترتیبات اور کیش",
      "settings.title":"سائٹ کی ترتیبات","settings.cache":"کیش صاف کریں","settings.cacheBtn":"کیش صاف کریں اور دوبارہ لوڈ کریں","settings.cacheKeep":"بیرونی اکاؤنٹس حذف نہیں ہوں گے، صرف مقامی کیش (GitHub ٹوکن محفوظ رہے گا)۔","settings.theme":"سائٹ تھیم","settings.sound":"بٹن کی آوازیں","settings.info":"معلومات",
      "card.apps":"ایپ لائبریری","card.settings":"سائٹ ترتیبات","card.library":"گیلری","card.contact":"رابطہ","card.download":"ڈاؤن لوڈ صفحہ","card.admin":"ایڈمن پینل","card.home":"ہوم",
      "filter.all":"سب","filter.tools":"ٹولز","filter.islamic":"اسلامی","filter.security":"سیکیورٹی","filter.games":"گیمز","filter.diagnostics":"تشخیص","filter.system":"سسٹم",
      "label.share":"شیئر:","label.copyLinkBtn":"لنک کاپی کریں","label.openSource":"اصل ماخذ کھولیں","label.reading":"سائٹ میں پڑھیں","label.loadingPage":"لوڈ ہو رہا ہے...","label.addScreens":"اسکرین شاٹس شامل کریں","label.showToken":"ٹوکن دکھائیں","label.hideToken":"ٹوکن چھپائیں","label.saveToken":"ٹوکن محفوظ کریں",
      "ph.searchWeb":"تلاش کے لیے لکھیں...","ph.searchApp":"ایپ تلاش کریں...",
      "status.webReady":"سائٹ کے اندر مکمل ویب تلاش۔ نتائج یہاں ظاہر ہوں گے۔",
      "404.title":"صفحہ نہیں ملا","404.desc":"لنک پرانا ہو سکتا ہے یا صفحہ منتقل ہو گیا ہے۔" },
    fa: { _dir:"rtl", _lang:"fa", _name:"فارسی",
      "menu.main":"منو","menu.settings":"تنظیمات و زبان‌ها","menu.quick":"پیوندهای سریع","menu.language":"زبان","menu.theme":"پوسته","menu.close":"بستن","menu.sections":"بخش‌ها - هر مکانی را انتخاب کنید",
      "nav.home":"خانه","nav.search":"جستجو","nav.apps":"برنامه‌ها","nav.stats":"اعداد","nav.clock":"ساعت","nav.services":"خدمات","nav.live":"زنده","nav.about":"درباره من","nav.contact":"تماس","nav.settings":"تنظیمات","nav.download":"دانلود","nav.admin":"مدیر","nav.library":"گالری",
      "action.login":"ورود","action.downloadApps":"دانلود برنامه‌ها","action.browseApps":"مرور برنامه‌ها","action.searchWeb":"جستجو در وب","action.contact":"تماس با من","action.shareSite":"اشتراک‌گذاری سایت","action.copyLink":"کپی پیوند","action.backHome":"بازگشت به خانه","action.allApps":"همه برنامه‌ها","action.search":"جستجو","action.backSite":"بازگشت به سایت","action.details":"جزئیات","action.downloadApk":"دانلود APK","action.requestActivate":"درخواست فعال‌سازی",
      "hero.eyebrow":"توسعه‌دهنده اندروید · عیب‌یابی گوشی · ابزارها","hero.lead":"من برنامه‌های کاربردی اندروید و ابزارهای عیب‌یابی آفلاین می‌سازم.","hero.muted":"از رقه، سوریه. برنامه‌ها: Smart Phone Detective، Noor Al-Fajr، Yahya Manager، RepairLive، Yahya Shield، Yahya Account Help، Yahya Games Topup و ماژول Magisk.",
      "stats.apps":"برنامه‌های منتشر شده","stats.issues":"مشکلات در دانشنامه","stats.offline":"ابزارهای آفلاین",
      "section.stats":"سایت در اعداد","section.search":"جستجو در کل وب","section.apps":"دانلود برنامه‌های من","section.clock":"ساعت سوریه","section.services":"توسعه و عیب‌یابی","section.live":"ویدیوها و پخش زنده","section.about":"درباره من","section.contact":"تماس","section.library":"تصاویر طبیعت (محلی + Google)","section.tech":"کتابخانه فنی",
      "footer.rights":"با دقت ساخته شده، روی GitHub Pages.","footer.admin":"بارگذاری برنامه","footer.settings":"تنظیمات و کش",
      "settings.title":"تنظیمات سایت","settings.cache":"پاک کردن کش","settings.cacheBtn":"پاک کردن کش و بارگذاری مجدد","settings.cacheKeep":"حساب‌های خارجی حذف نمی‌شوند، فقط کش محلی (توکن GitHub حفظ می‌شود).","settings.theme":"پوسته سایت","settings.sound":"صداهای دکمه","settings.info":"اطلاعات",
      "card.apps":"کتابخانه برنامه‌ها","card.settings":"تنظیمات سایت","card.library":"گالری","card.contact":"تماس","card.download":"صفحه دانلود","card.admin":"پنل مدیریت","card.home":"خانه",
      "filter.all":"همه","filter.tools":"ابزارها","filter.islamic":"اسلامی","filter.security":"امنیت","filter.games":"بازی‌ها","filter.diagnostics":"عیب‌یابی","filter.system":"سیستم",
      "label.share":"اشتراک‌گذاری:","label.copyLinkBtn":"کپی پیوند","label.openSource":"باز کردن منبع","label.reading":"خواندن در سایت","label.loadingPage":"در حال بارگذاری...","label.addScreens":"افزودن اسکرین‌شات","label.showToken":"نمایش توکن","label.hideToken":"پنهان کردن توکن","label.saveToken":"ذخیره توکن",
      "ph.searchWeb":"آنچه می‌خواهید جستجو کنید بنویسید...","ph.searchApp":"جستجوی برنامه...",
      "status.webReady":"جستجوی کامل وب در سایت. نتایج اینجا نمایش داده می‌شوند.",
      "404.title":"صفحه پیدا نشد","404.desc":"پیوند ممکن است قدیمی باشد یا صفحه منتقل شده باشد." },
    zh: { _dir:"ltr", _lang:"zh", _name:"中文",
      "menu.main":"菜单","menu.settings":"设置和语言","menu.quick":"快速链接","menu.language":"语言","menu.theme":"主题","menu.close":"关闭","menu.sections":"版块 - 选择任意位置",
      "nav.home":"首页","nav.search":"搜索","nav.apps":"应用","nav.stats":"数据","nav.clock":"时钟","nav.services":"服务","nav.live":"直播","nav.about":"关于","nav.contact":"联系","nav.settings":"设置","nav.download":"下载","nav.admin":"管理","nav.library":"图库",
      "action.login":"登录","action.downloadApps":"下载应用","action.browseApps":"浏览应用","action.searchWeb":"搜索网页","action.contact":"联系我","action.shareSite":"分享网站","action.copyLink":"复制链接","action.backHome":"返回首页","action.allApps":"全部应用","action.search":"搜索","action.backSite":"返回网站","action.details":"详情","action.downloadApk":"下载 APK","action.requestActivate":"申请激活",
      "hero.eyebrow":"Android 开发者 · 手机诊断 · 工具","hero.lead":"我构建实用的 Android 应用和离线手机诊断工具。","hero.muted":"来自叙利亚拉卡。应用包括 Smart Phone Detective、Noor Al-Fajr、Yahya Manager、RepairLive、Yahya Shield、Yahya Account Help、Yahya Games Topup 和 Magisk 模块。",
      "stats.apps":"已发布应用","stats.issues":"百科中的故障","stats.offline":"离线工具",
      "section.stats":"网站数据","section.search":"搜索整个互联网","section.apps":"下载我的应用","section.clock":"叙利亚时钟","section.services":"开发与诊断","section.live":"视频与直播","section.about":"关于我","section.contact":"联系我","section.library":"自然图片（本地 + Google）","section.tech":"技术资料库",
      "footer.rights":"精心制作，托管于 GitHub Pages。","footer.admin":"上传应用","footer.settings":"设置和缓存",
      "settings.title":"网站设置","settings.cache":"清除缓存","settings.cacheBtn":"清除缓存并重新加载","settings.cacheKeep":"不会删除外部账户，仅清除本地缓存（保留已保存的 GitHub Token）。","settings.theme":"网站主题","settings.sound":"按钮声音","settings.info":"信息",
      "card.apps":"应用库","card.settings":"网站设置","card.library":"图库","card.contact":"联系","card.download":"下载页面","card.admin":"管理面板","card.home":"首页",
      "filter.all":"全部","filter.tools":"工具","filter.islamic":"伊斯兰","filter.security":"安全","filter.games":"游戏","filter.diagnostics":"诊断","filter.system":"系统",
      "label.share":"分享：","label.copyLinkBtn":"复制链接","label.openSource":"打开原始来源","label.reading":"站内阅读","label.loadingPage":"加载中...","label.addScreens":"添加截图","label.showToken":"显示令牌","label.hideToken":"隐藏令牌","label.saveToken":"保存令牌",
      "ph.searchWeb":"输入要搜索的内容...","ph.searchApp":"搜索应用...",
      "status.webReady":"站内完整网页搜索，结果显示在这里。",
      "404.title":"页面未找到","404.desc":"链接可能已过期或页面已移动。" },
    ja: { _dir:"ltr", _lang:"ja", _name:"日本語",
      "menu.main":"メニュー","menu.settings":"設定と言語","menu.quick":"クイックリンク","menu.language":"言語","menu.theme":"テーマ","menu.close":"閉じる","menu.sections":"セクション - 場所を選択",
      "nav.home":"ホーム","nav.search":"検索","nav.apps":"アプリ","nav.stats":"数値","nav.clock":"時計","nav.services":"サービス","nav.live":"ライブ","nav.about":"概要","nav.contact":"連絡先","nav.settings":"設定","nav.download":"ダウンロード","nav.admin":"管理","nav.library":"ギャラリー",
      "action.login":"ログイン","action.downloadApps":"アプリをダウンロード","action.browseApps":"アプリを見る","action.searchWeb":"ウェブ検索","action.contact":"連絡する","action.shareSite":"サイトを共有","action.copyLink":"リンクをコピー","action.backHome":"ホームへ戻る","action.allApps":"すべてのアプリ","action.search":"検索","action.backSite":"サイトへ戻る","action.details":"詳細","action.downloadApk":"APKをダウンロード","action.requestActivate":"有効化を申請",
      "hero.eyebrow":"Android開発者 · スマホ診断 · ツール","hero.lead":"実用的なAndroidアプリとオフラインのスマホ診断ツールを作っています。","hero.muted":"シリア・ラッカ出身。アプリ: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup, Magiskモジュール。",
      "stats.apps":"公開アプリ","stats.issues":"百科事典の不具合","stats.offline":"オフラインツール",
      "section.stats":"サイトの数値","section.search":"ウェブ全体を検索","section.apps":"アプリをダウンロード","section.clock":"シリアの時計","section.services":"開発と診断","section.live":"動画とライブ","section.about":"私について","section.contact":"連絡先","section.library":"自然画像（ローカル + Google）","section.tech":"技術ライブラリ",
      "footer.rights":"丁寧に作成、GitHub Pagesで公開。","footer.admin":"アプリをアップロード","footer.settings":"設定とキャッシュ",
      "settings.title":"サイト設定","settings.cache":"キャッシュを削除","settings.cacheBtn":"キャッシュ削除して再読み込み","settings.cacheKeep":"外部アカウントは削除されません。ローカルキャッシュのみ（保存済みGitHubトークンは保持）。","settings.theme":"サイトテーマ","settings.sound":"ボタン音","settings.info":"情報",
      "card.apps":"アプリライブラリ","card.settings":"サイト設定","card.library":"ギャラリー","card.contact":"連絡先","card.download":"ダウンロードページ","card.admin":"管理パネル","card.home":"ホーム",
      "filter.all":"すべて","filter.tools":"ツール","filter.islamic":"イスラム","filter.security":"セキュリティ","filter.games":"ゲーム","filter.diagnostics":"診断","filter.system":"システム",
      "label.share":"共有:","label.copyLinkBtn":"リンクをコピー","label.openSource":"元のソースを開く","label.reading":"サイト内で読む","label.loadingPage":"読み込み中...","label.addScreens":"スクリーンショットを追加","label.showToken":"トークンを表示","label.hideToken":"トークンを隠す","label.saveToken":"トークンを保存",
      "ph.searchWeb":"検索したい内容を入力...","ph.searchApp":"アプリを検索...",
      "status.webReady":"サイト内でウェブ検索。結果はここに表示されます。",
      "404.title":"ページが見つかりません","404.desc":"リンクが古いか、ページが移動した可能性があります。" },
    ko: { _dir:"ltr", _lang:"ko", _name:"한국어",
      "menu.main":"메뉴","menu.settings":"설정 및 언어","menu.quick":"빠른 링크","menu.language":"언어","menu.theme":"테마","menu.close":"닫기","menu.sections":"섹션 - 원하는 위치 선택",
      "nav.home":"홈","nav.search":"검색","nav.apps":"앱","nav.stats":"수치","nav.clock":"시계","nav.services":"서비스","nav.live":"라이브","nav.about":"소개","nav.contact":"연락처","nav.settings":"설정","nav.download":"다운로드","nav.admin":"관리자","nav.library":"갤러리",
      "action.login":"로그인","action.downloadApps":"앱 다운로드","action.browseApps":"앱 둘러보기","action.searchWeb":"웹 검색","action.contact":"문의하기","action.shareSite":"사이트 공유","action.copyLink":"링크 복사","action.backHome":"홈으로","action.allApps":"모든 앱","action.search":"검색","action.backSite":"사이트로 돌아가기","action.details":"상세정보","action.downloadApk":"APK 다운로드","action.requestActivate":"활성화 요청",
      "hero.eyebrow":"Android 개발자 · 휴대폰 진단 · 도구","hero.lead":"실용적인 Android 앱과 오프라인 휴대폰 진단 도구를 만듭니다.","hero.muted":"시리아 라카 출신. 앱: Smart Phone Detective, Noor Al-Fajr, Yahya Manager, RepairLive, Yahya Shield, Yahya Account Help, Yahya Games Topup, Magisk 모듈.",
      "stats.apps":"게시된 앱","stats.issues":"백과사전의 문제","stats.offline":"오프라인 도구",
      "section.stats":"숫자로 보는 사이트","section.search":"웹 전체 검색","section.apps":"내 앱 다운로드","section.clock":"시리아 시계","section.services":"개발 및 진단","section.live":"동영상 및 라이브","section.about":"소개","section.contact":"연락처","section.library":"자연 이미지 (로컬 + Google)","section.tech":"기술 라이브러리",
      "footer.rights":"정성껏 제작, GitHub Pages에서 운영.","footer.admin":"앱 업로드","footer.settings":"설정 및 캐시",
      "settings.title":"사이트 설정","settings.cache":"캐시 지우기","settings.cacheBtn":"캐시 지우고 새로고침","settings.cacheKeep":"외부 계정은 삭제되지 않으며 로컬 캐시만 삭제됩니다(저장된 GitHub 토큰 유지).","settings.theme":"사이트 테마","settings.sound":"버튼 소리","settings.info":"정보",
      "card.apps":"앱 라이브러리","card.settings":"사이트 설정","card.library":"갤러리","card.contact":"연락처","card.download":"다운로드 페이지","card.admin":"관리자 패널","card.home":"홈",
      "filter.all":"전체","filter.tools":"도구","filter.islamic":"이슬람","filter.security":"보안","filter.games":"게임","filter.diagnostics":"진단","filter.system":"시스템",
      "label.share":"공유:","label.copyLinkBtn":"링크 복사","label.openSource":"원본 열기","label.reading":"사이트에서 읽기","label.loadingPage":"불러오는 중...","label.addScreens":"스크린샷 추가","label.showToken":"토큰 표시","label.hideToken":"토큰 숨기기","label.saveToken":"토큰 저장",
      "ph.searchWeb":"검색어를 입력하세요...","ph.searchApp":"앱 검색...",
      "status.webReady":"사이트 내 전체 웹 검색. 결과가 여기에 표시됩니다.",
      "404.title":"페이지를 찾을 수 없음","404.desc":"링크가 오래되었거나 페이지가 이동되었을 수 있습니다." }
  };

  // build full dictionaries: BASE + language overrides
  var DICT = {};
  for (var i = 0; i < SUPPORTED.length; i++) {
    var code = SUPPORTED[i];
    var d = {};
    for (var k in BASE) { if (Object.prototype.hasOwnProperty.call(BASE, k)) d[k] = BASE[k]; }
    var ov = L[code] || {};
    for (var k2 in ov) { if (Object.prototype.hasOwnProperty.call(ov, k2)) d[k2] = ov[k2]; }
    DICT[code] = d;
  }

  function getLang() {
    try { var s = localStorage.getItem(STORAGE_KEY); if (SUPPORTED.indexOf(s) !== -1) return s; } catch (e) {}
    return DEFAULT_LANG;
  }
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyLang(lang);
  }
  function t(key, lang) {
    lang = lang || getLang();
    var d = DICT[lang] || DICT[DEFAULT_LANG];
    return (d && d[key]) || (DICT.en && DICT.en[key]) || (DICT[DEFAULT_LANG] && DICT[DEFAULT_LANG][key]) || "";
  }
  function applyLang(lang) {
    var d = DICT[lang] || DICT[DEFAULT_LANG];
    document.documentElement.lang = d._lang || lang;
    document.documentElement.dir = d._dir || "rtl";
    function setAll(sel, attr, getter) {
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].getAttribute(attr);
        var val = getter(key, lang);
        if (!val) continue;
        if (attr === "data-i18n") nodes[i].textContent = val;
        else if (attr === "data-i18n-html") nodes[i].innerHTML = val;
        else if (attr === "data-i18n-placeholder") nodes[i].setAttribute("placeholder", val);
        else if (attr === "data-i18n-aria") nodes[i].setAttribute("aria-label", val);
        else if (attr === "data-i18n-title") nodes[i].setAttribute("title", val);
      }
    }
    setAll("[data-i18n]", "data-i18n", t);
    setAll("[data-i18n-html]", "data-i18n-html", t);
    setAll("[data-i18n-placeholder]", "data-i18n-placeholder", t);
    setAll("[data-i18n-aria]", "data-i18n-aria", t);
    setAll("[data-i18n-title]", "data-i18n-title", t);
    var btns = document.querySelectorAll("[data-set-lang]");
    for (var b = 0; b < btns.length; b++) {
      var active = btns[b].getAttribute("data-set-lang") === lang;
      if (btns[b].classList) btns[b].classList.toggle("active", active);
      btns[b].setAttribute("aria-pressed", active ? "true" : "false");
    }
    try { document.dispatchEvent(new CustomEvent("yahya:langchange", { detail: { lang: lang } })); } catch (e) {}
  }
  function initMenus() {
    var pairs = [{ btn:"siteMenuBtn", panel:"siteMenuPanel" }, { btn:"siteSettingsBtn", panel:"siteSettingsPanel" }];
    function closeAll(except) {
      for (var i = 0; i < pairs.length; i++) {
        var p = document.getElementById(pairs[i].panel), b = document.getElementById(pairs[i].btn);
        if (!p) continue;
        if (except && p.id === except) continue;
        p.hidden = true; if (b) b.setAttribute("aria-expanded","false");
      }
    }
    function positionPanel(panel, btn, panelId) {
      if (!panel || !btn) return;
      var r = btn.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.top = Math.max(56, r.bottom + 8) + "px";
      if (panelId === "siteMenuPanel") {
        panel.style.insetInlineStart = "8px";
        panel.style.insetInlineEnd = "auto";
        panel.style.left = "8px";
        panel.style.right = "auto";
      } else {
        panel.style.insetInlineEnd = "8px";
        panel.style.insetInlineStart = "auto";
        panel.style.right = "8px";
        panel.style.left = "auto";
      }
    }
    for (var j = 0; j < pairs.length; j++) {
      (function(pair){
        var btn=document.getElementById(pair.btn), panel=document.getElementById(pair.panel);
        if(!btn||!panel) return;
        btn.addEventListener("click", function(e){
          e.stopPropagation();
          var open=panel.hidden;
          closeAll(open?pair.panel:null);
          panel.hidden=!open;
          btn.setAttribute("aria-expanded",open?"true":"false");
          if (open) positionPanel(panel, btn, pair.panel);
        });
      })(pairs[j]);
    }
    document.addEventListener("click", function(e){ var inside=e.target&&e.target.closest&&e.target.closest(".top-panel, .top-menu-btn"); if(!inside) closeAll(null); });
    document.addEventListener("keydown", function(e){ if(e.key==="Escape"||e.key==="Esc") closeAll(null); });
    var closers=document.querySelectorAll("[data-close-panels]"); for(var c=0;c<closers.length;c++){ closers[c].addEventListener("click", function(){ closeAll(null); }); }
  }
    function renderLangOptions() {
    var containers = document.querySelectorAll("[data-lang-options]");
    for (var i = 0; i < containers.length; i++) {
      var wrap = containers[i];
      if (wrap.getAttribute("data-lang-rendered") === "1") continue;
      wrap.innerHTML = "";
      for (var j = 0; j < SUPPORTED.length; j++) {
        var code = SUPPORTED[j];
        var d = DICT[code] || {};
        var btn = document.createElement("button");
        btn.className = "lang-btn";
        btn.type = "button";
        btn.setAttribute("data-set-lang", code);
        btn.setAttribute("aria-pressed", "false");
        btn.textContent = d._name || code;
        wrap.appendChild(btn);
      }
      wrap.setAttribute("data-lang-rendered", "1");
    }
  }
  function initLangButtons() {
    renderLangOptions();
    var btns=document.querySelectorAll("[data-set-lang]");
    for(var i=0;i<btns.length;i++){ if(!btns[i].__yahyaLangBound){ btns[i].__yahyaLangBound=true; btns[i].addEventListener("click", function(){ setLang(this.getAttribute("data-set-lang")); }); } }
  }
  function init() { var lang=getLang(); applyLang(lang); initMenus(); initLangButtons(); }
  window.YahyaI18n = { getLang:getLang, setLang:setLang, t:t, apply:applyLang, langs:SUPPORTED, dict:DICT, renderLangOptions:renderLangOptions };
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
