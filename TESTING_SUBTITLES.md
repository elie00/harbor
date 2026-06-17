# 🧪 دليل اختبار نظام الترجمة | Subtitle System Testing Guide

## 📝 التحديثات الأخيرة | Recent Updates

### ✅ إزالة الحد عن ترجمات إضافات Stremio | Unlimited Stremio Addon Subtitles
**التاريخ | Date**: الجلسة الحالية | Current session  
**الحالة | Status**: مكتمل | Completed

تم إزالة الحد الأقصى لترجمات إضافات Stremio مع الحفاظ على الحد للمصادر الأخرى.

**التغييرات | Changes**:
- **إضافات Stremio | Stremio Addons**: لا يوجد حد (غير محدود | NO LIMIT - unlimited)
- **OpenSubtitles**: حد 30 لكل لغة (محفوظ | 30 per language - maintained)
- **Wyzie**: حد 30 لكل لغة (محفوظ | 30 per language - maintained)
- **Jimaku**: حد 30 لكل لغة (محفوظ | 30 per language - maintained)

**مثال | Example**:
- قبل | Before: OpenSubtitles (30) + Addons (محدود بـ 30 | limited to 30) = 30 كحد أقصى
- بعد | After: OpenSubtitles (30) + Addons (غير محدود | unlimited) = 30+ ترجمة

**راجع | See**: `SUBTITLE_LIMIT_UPDATE.md` للتفاصيل الكاملة | for full details

---

### ✅ أزرار إعادة التحميل | Reload Buttons Added
**التاريخ | Date**: الجلسة الحالية | Current session  
**الحالة | Status**: مكتمل | Completed

تم إضافة أزرار إعادة التحميل في ثلاثة أقسام:
1. **قسم الترجمة | Subtitle Section**: زر لتحديث البحث عن الترجمات
2. **اختيار المصادر | Stream Picker**: زر لتحديث جميع مصادر البث
3. **الصفحة الرئيسية | Home Page**: زر لتحديث المكتبة والمحتوى

**راجع | See**: `RELOAD_BUTTONS.md` لتفاصيل التطبيق | for implementation details

---

## 🚀 كيفية تشغيل التطبيق مع السجلات

### 1. **تشغيل التطبيق في وضع التطوير:**

```bash
cd "/Users/yasser/Downloads/harbor-main newUpdate"
npm run tauri dev
```

**ملاحظة:** احتفظ بنافذة Terminal مفتوحة - ستظهر فيها جميع السجلات!

---

## 📋 ما يجب البحث عنه في Terminal

### **عند فتح قائمة الترجمات والبحث:**

#### ✅ **1. تحميل الإضافات (يجب أن يظهر أولاً):**

```
[addon-source] Gathering subtitle addons, authKey: true
[addon-source] Cloud addons: 3
[addon-source] Local addons (not in cloud): 1
[addon-source] Total merged addons: 4
[addon-source] Addons with subtitle resource: 3 (OpenSubtitles V3, SubSource, SubDL)
```

**ما يعني:**
- يجب أن ترى **أكثر من إضافة واحدة** في السطر الأخير
- إذا رأيت فقط `OpenSubtitles` → **المشكلة: لا توجد إضافات أخرى مثبتة**

---

#### ✅ **2. بدء البحث:**

```
[SUBTITLES SEARCH] Starting with: {
  hasImdbId: true,
  addonsCount: 3,
  providers: { wyzie: false, addons: true, opensubtitles: true },
  query: { ... }
}
```

**تحقق من:**
- `addonsCount` يجب أن يكون **> 0**
- `providers.addons` يجب أن يكون **true**

---

#### ✅ **3. تصفية الإضافات:**

```
[addons] searchAddons called with 3 addons
[addons] Content ID: tt1234567, Type: movie
[addons] Filtered subtitle addons: 2 of 3 (SubSource, SubDL)
```

**المهم:**
- إذا كان `Filtered subtitle addons: 0` → **المشكلة: الإضافات لا تدعم هذا النوع من المحتوى**

---

#### ✅ **4. جلب الترجمات من كل إضافة:**

```
[addons] Fetching from SubSource: https://...
[addons] SubSource returned 12 subtitles
[addons] Fetching from SubDL: https://...
[addons] SubDL returned 8 subtitles
[addons] Total addon results: 20
```

**ما يعني:**
- كل إضافة تُجلب بشكل منفصل
- إذا رأيت `returned 0 subtitles` → **الإضافة لا تحتوي على ترجمات لهذا المحتوى**

---

#### ✅ **5. النتيجة النهائية:**

```
[SUBTITLES SEARCH] Complete: {
  total: 42,
  bySource: { opensubtitles: 22, addon: 20 },
  addonResults: 20,
  opensubtitlesResults: 22
}
```

**التوقعات:**
- ✅ `addonResults` يجب أن يكون **> 0** إذا كانت الإضافات تعمل
- ✅ `total` = مجموع جميع المصادر
- ❌ إذا كان `addonResults: 0` → **هناك مشكلة!**

---

## 🔍 سيناريوهات المشاكل الشائعة

### ❌ **المشكلة 1: لا توجد إضافات غير OpenSubtitles**

**السجل:**
```
[addon-source] Addons with subtitle resource: 1 (OpenSubtitles V3)
```

**السبب:** لم تُثبّت إضافات ترجمة أخرى

**الحل:**
1. اذهب إلى Addons > Discover
2. ابحث عن: `SubSource` أو `SubDL` أو `subdl`
3. قم بتثبيت واحدة على الأقل
4. أعد تشغيل التطبيق

---

### ❌ **المشكلة 2: الإضافات موجودة لكن لا تظهر نتائج**

**السجل:**
```
[addon-source] Addons with subtitle resource: 3 (OpenSubtitles V3, SubSource, SubDL)
[addons] Filtered subtitle addons: 0 of 3 ()
```

**السبب:** الإضافات لا تدعم نوع المحتوى (movie/series)

**الحل:**
- تأكد من أن الإضافات تدعم Movies **و** Series
- جرب محتوى مختلف (فيلم بدلاً من مسلسل أو العكس)

---

### ❌ **المشكلة 3: الإضافات مفلترة لكن لا ترجمات**

**السجل:**
```
[addons] Filtered subtitle addons: 2 of 3 (SubSource, SubDL)
[addons] SubSource returned 0 subtitles
[addons] SubDL returned 0 subtitles
[addons] Total addon results: 0
```

**السبب:** الإضافات لا تحتوي على ترجمات لهذا المحتوى المحدد

**الحل:**
- هذا طبيعي! ليس كل فيلم/مسلسل له ترجمات في كل المصادر
- جرب محتوى آخر أكثر شهرة
- OpenSubtitles عادةً لديه تغطية أوسع

---

### ❌ **المشكلة 4: أخطاء في جلب الترجمات**

**السجل:**
```
[addons] SubSource returned 403
[addons] SubDL error: Network error
```

**السبب:** مشاكل في الاتصال أو الإضافة معطلة

**الحل:**
- تحقق من اتصال الإنترنت
- قد تكون الإضافة معطلة مؤقتاً
- جرب لاحقاً

---

## 📸 الصورة المثالية (كل شيء يعمل)

```
[addon-source] Gathering subtitle addons, authKey: true
[addon-source] Cloud addons: 3
[addon-source] Local addons (not in cloud): 1  
[addon-source] Total merged addons: 4
[addon-source] Addons with subtitle resource: 3 (OpenSubtitles V3, SubSource, SubDL)

[SUBTITLES SEARCH] Starting with: {
  hasImdbId: true,
  addonsCount: 3,
  providers: { wyzie: false, addons: true, opensubtitles: true }
}

[addons] searchAddons called with 3 addons
[addons] Content ID: tt1234567, Type: movie
[addons] Filtered subtitle addons: 2 of 3 (SubSource, SubDL)

[addons] Fetching from SubSource: https://...
[addons] SubSource returned 12 subtitles
[addons] Fetching from SubDL: https://...  
[addons] SubDL returned 8 subtitles
[addons] Total addon results: 20

[SUBTITLES SEARCH] Complete: {
  total: 42,
  bySource: { opensubtitles: 22, addon: 20 },
  addonResults: 20,
  opensubtitlesResults: 22
}
```

---

## 💡 نصائح للاختبار

1. **استخدم محتوى شهير للاختبار:**
   - أفلام Marvel/Disney
   - مسلسلات معروفة (Breaking Bad, Game of Thrones)
   - هذه عادةً لديها ترجمات في جميع المصادر

2. **تأكد من وجود IMDb ID:**
   - الإضافات تحتاج IMDb ID للبحث
   - افتح محتوى من المكتبة وليس من بحث محلي

3. **راقب Terminal باستمرار:**
   - افتح المشغل
   - اذهب إلى الترجمات
   - اضغط "Find more subtitles"
   - راقب Terminal فوراً

---

## 📤 ما أحتاجه منك

بعد الاختبار، أرسل لي:

1. **آخر 50 سطر من Terminal** بعد البحث عن الترجمات
2. **اسم المحتوى** الذي اختبرت عليه
3. **هل ظهرت إضافات غير OpenSubtitles في النتائج؟**

---

**ملاحظة مهمة:** إذا لم تظهر أي سجلات في Terminal، تأكد من:
- تشغيل التطبيق بـ `npm run tauri dev` (وليس من ملف تنفيذي)
- Terminal لا يزال مفتوحاً ونشطاً
- لا توجد فلاتر على output في Terminal
