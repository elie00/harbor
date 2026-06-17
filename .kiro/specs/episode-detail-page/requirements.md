# متطلبات صفحة تفاصيل الحلقة

## مقدمة

صفحة تفاصيل الحلقة هي ميزة جديدة في تطبيق Harbor تهدف إلى تحسين تجربة المستخدم عند تصفح حلقات المسلسلات. حالياً، عند الضغط على حلقة، يتم الانتقال مباشرة إلى صفحة اختيار الستريم. هذه الميزة ستضيف خطوة وسيطة تعرض تفاصيل شاملة عن الحلقة قبل التشغيل.

## المصطلحات

- **Harbor_App**: تطبيق Harbor الرئيسي لتشغيل محتوى الفيديو
- **Episode_Detail_Page**: الصفحة الجديدة التي تعرض تفاصيل الحلقة
- **Episode_Card**: بطاقة الحلقة المعروضة في قائمة الحلقات
- **Play_Button**: زر التشغيل الموجود على بطاقة الحلقة
- **Episode_Clickable_Area**: المنطقة القابلة للضغط (اسم/صورة الحلقة)
- **Play_Picker**: صفحة اختيار مصدر الستريم
- **Hero_Section**: منطقة العرض الرئيسية في أعلى الصفحة
- **TMDB_API**: واجهة برمجية لقاعدة بيانات الأفلام والمسلسلات
- **Cinemeta**: مصدر بيانات بديل للمحتوى
- **Episode_Route**: مسار التوجيه الخاص بصفحة الحلقة
- **Series_Meta**: بيانات المسلسل الأصلي
- **Episode_Metadata**: البيانات الوصفية للحلقة (العنوان، الوصف، التقييم، إلخ)
- **Episode_Stills**: الصور الثابتة المأخوذة من الحلقة
- **Guest_Stars**: النجوم الضيوف في الحلقة
- **Auto_Play_Setting**: إعداد المستخدم لتفعيل التشغيل التلقائي
- **Navigation_Context**: السياق الذي جاء منه المستخدم (صفحة التفاصيل، Continue Watching، إلخ)

## المتطلبات

### المتطلب 1: توجيه الحلقة

**قصة المستخدم:** كمستخدم، أريد الوصول إلى صفحة تفاصيل الحلقة عبر رابط مباشر، حتى أتمكن من مشاركة الحلقات والعودة إليها.

#### معايير القبول

1. THE Harbor_App SHALL support the route pattern `/detail/:seriesId/episode/:season/:episode`
2. WHEN a user navigates to an Episode_Route, THE Harbor_App SHALL render the Episode_Detail_Page
3. THE Episode_Route SHALL accept numeric values for season and episode parameters
4. WHEN an invalid Episode_Route is provided, THE Harbor_App SHALL display an error message and provide a link to return to the series page

### المتطلب 2: سلوك الضغط على بطاقة الحلقة

**قصة المستخدم:** كمستخدم، أريد أن يكون لدي خيارات واضحة للتشغيل أو عرض التفاصيل، حتى أتمكن من اختيار الإجراء المناسب.

#### معايير القبول

1. WHEN a user clicks the Play_Button on an Episode_Card, THE Harbor_App SHALL navigate directly to the Play_Picker according to the Auto_Play_Setting
2. WHEN a user clicks the Episode_Clickable_Area on an Episode_Card, THE Harbor_App SHALL navigate to the Episode_Detail_Page
3. THE Episode_Card SHALL maintain distinct click regions for Play_Button and Episode_Clickable_Area
4. THE Episode_Card SHALL provide visual feedback (hover state) to distinguish between Play_Button and Episode_Clickable_Area

### المتطلب 3: عرض معلومات الحلقة الأساسية

**قصة المستخدم:** كمستخدم، أريد رؤية معلومات شاملة عن الحلقة، حتى أتمكن من معرفة ما سأشاهده قبل التشغيل.

#### معايير القبول

1. THE Episode_Detail_Page SHALL display the episode title and number in the format "S{season}E{episode} - {title}"
2. THE Episode_Detail_Page SHALL display the episode overview text
3. WHEN Episode_Metadata includes a rating, THE Episode_Detail_Page SHALL display the rating value
4. WHEN Episode_Metadata includes an air date, THE Episode_Detail_Page SHALL display the formatted air date
5. WHEN Episode_Metadata includes runtime, THE Episode_Detail_Page SHALL display the runtime in minutes
6. THE Episode_Detail_Page SHALL display the series name as a breadcrumb or parent context

### المتطلب 4: جلب بيانات الحلقة من TMDB

**قصة المستخدم:** كمطور، أريد جلب بيانات الحلقة من TMDB API، حتى أحصل على معلومات غنية ومحدثة.

#### معايير القبول

1. WHEN Episode_Detail_Page is loaded, THE Harbor_App SHALL attempt to fetch Episode_Metadata from TMDB_API
2. THE Harbor_App SHALL use the TMDB season episodes endpoint with the series TMDB ID
3. WHEN TMDB_API returns Episode_Metadata, THE Harbor_App SHALL extract title, overview, still_path, air_date, runtime, and vote_average
4. WHEN TMDB_API is unavailable or returns an error, THE Harbor_App SHALL fallback to Cinemeta data
5. THE Harbor_App SHALL cache Episode_Metadata for 24 hours to reduce API calls

### المتطلب 5: عرض صور الحلقة

**قصة المستخدم:** كمستخدم، أريد رؤية صور من الحلقة، حتى أحصل على معاينة بصرية للمحتوى.

#### معايير القبول

1. WHEN Episode_Metadata includes Episode_Stills, THE Episode_Detail_Page SHALL display up to 12 stills in a scrollable gallery
2. THE Episode_Detail_Page SHALL display Episode_Stills as clickable thumbnails that open in a lightbox view
3. WHEN no Episode_Stills are available from TMDB_API, THE Episode_Detail_Page SHALL use the episode thumbnail from Cinemeta as the primary image
4. THE Episode_Detail_Page SHALL lazy-load Episode_Stills for performance optimization

### المتطلب 6: منطقة العرض الرئيسية (Hero Section)

**قصة المستخدم:** كمستخدم، أريد رؤية عرض جذاب ومميز للحلقة، حتى أحصل على تجربة بصرية غنية.

#### معايير القبول

1. THE Episode_Detail_Page SHALL render a Hero_Section with the episode still or series backdrop as background
2. THE Hero_Section SHALL apply a gradient overlay to ensure text readability
3. THE Hero_Section SHALL display the episode title, season/episode number, and series name
4. THE Hero_Section SHALL include a prominent Play_Button that follows Auto_Play_Setting behavior
5. THE Hero_Section SHALL reuse the Hero_Section component from the series detail page with episode-specific data

### المتطلب 7: معلومات طاقم التمثيل والضيوف

**قصة المستخدم:** كمستخدم، أريد معرفة من شارك في الحلقة، حتى أتمكن من اكتشاف ممثلين جدد أو متابعة ممثلين مفضلين.

#### معايير القبول

1. WHEN Episode_Metadata includes Guest_Stars, THE Episode_Detail_Page SHALL display them in a scrollable cast row
2. THE Episode_Detail_Page SHALL display each Guest_Star with their photo, name, and character name
3. THE Episode_Detail_Page SHALL reuse the cast display components from the series detail page
4. WHEN no Guest_Stars are available, THE Episode_Detail_Page SHALL hide the cast section

### المتطلب 8: زر التشغيل الرئيسي

**قصة المستخدم:** كمستخدم، أريد زر تشغيل واضح وبارز، حتى أتمكن من بدء مشاهدة الحلقة بسرعة.

#### معايير القبول

1. THE Episode_Detail_Page SHALL display a primary Play_Button in the Hero_Section
2. WHEN the Play_Button is clicked, THE Harbor_App SHALL navigate to Play_Picker according to Auto_Play_Setting
3. THE Play_Button SHALL pass all episode context (season, episode, name, still, overview) to Play_Picker
4. THE Play_Button SHALL maintain visual consistency with the Play_Button on Episode_Card

### المتطلب 9: التنقل إلى صفحة المسلسل

**قصة المستخدم:** كمستخدم، أريد العودة بسهولة إلى صفحة المسلسل الأصلي، حتى أتمكن من تصفح حلقات أخرى.

#### معايير القبول

1. THE Episode_Detail_Page SHALL display the series name as a clickable link
2. WHEN the series name link is clicked, THE Harbor_App SHALL navigate to the series detail page
3. THE Episode_Detail_Page SHALL display a back button in the navigation header
4. WHEN the back button is clicked, THE Harbor_App SHALL navigate to the previous page in Navigation_Context

### المتطلب 10: دعم Fallback للبيانات

**قصة المستخدم:** كمطور، أريد دعم مصادر بيانات متعددة، حتى تظهر صفحة الحلقة حتى عند فشل المصدر الأساسي.

#### معايير القبول

1. WHEN TMDB_API fails to return Episode_Metadata, THE Harbor_App SHALL attempt to fetch data from Cinemeta
2. WHEN both TMDB_API and Cinemeta fail, THE Episode_Detail_Page SHALL display basic information from Series_Meta
3. THE Harbor_App SHALL display a loading state while fetching Episode_Metadata
4. THE Episode_Detail_Page SHALL gracefully handle missing optional fields (rating, stills, guest stars)

### المتطلب 11: تحديث مكونات الحلقة الموجودة

**قصة المستخدم:** كمطور، أريد تحديث المكونات الموجودة لدعم التنقل الجديد، حتى تكون التجربة متسقة في جميع أنحاء التطبيق.

#### معايير القبول

1. THE Harbor_App SHALL update episode cards in series-episodes.tsx to navigate to Episode_Detail_Page on Episode_Clickable_Area click
2. THE Harbor_App SHALL update episode cards in series-episode-row.tsx to navigate to Episode_Detail_Page on Episode_Clickable_Area click
3. THE Harbor_App SHALL update episode cards in episode-strip.tsx to navigate to Episode_Detail_Page on Episode_Clickable_Area click
4. THE Harbor_App SHALL update continue watching cards in cw-section.tsx to navigate to Episode_Detail_Page when appropriate
5. THE Harbor_App SHALL maintain backward compatibility with the existing Play_Button behavior

### المتطلب 12: إعادة استخدام المكونات

**قصة المستخدم:** كمطور، أريد إعادة استخدام المكونات الموجودة، حتى أحافظ على التصميم المتسق وأقلل من تكرار الكود.

#### معايير القبول

1. THE Episode_Detail_Page SHALL reuse the Hero_Section layout pattern from detail.tsx
2. THE Episode_Detail_Page SHALL reuse the Rating display component from detail.tsx
3. THE Episode_Detail_Page SHALL reuse the Synopsis component for episode overview
4. THE Episode_Detail_Page SHALL reuse the CastCard component for Guest_Stars display
5. THE Episode_Detail_Page SHALL reuse the MediaGallery component for Episode_Stills
6. THE Episode_Detail_Page SHALL maintain visual consistency with the series detail page
