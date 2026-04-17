import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import DateTimePicker from '@react-native-community/datetimepicker';
import TagInput from '../components/TagInput';
import { movementDisciplines } from '../data/placeholderData';
import { useTheme } from '../theme';

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function EditScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { video, onSave } = route.params;

  const [videoUri, setVideoUri] = useState(video.videoUri ?? null);
  const [thumbnailUri, setThumbnailUri] = useState(video.thumbnail ?? null);
  const [title, setTitle] = useState(video.title ?? '');
  const [selectedTypes, setSelectedTypes] = useState(video.movementTypes ?? []);
  const [tags, setTags] = useState(video.tags ?? []);
  const [date, setDate] = useState(parseDate(video.date));
  const [description, setDescription] = useState(video.description ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [iosTempDate, setIosTempDate] = useState(parseDate(video.date));
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const scrollRef = useRef(null);
  const formY = useRef(0);
  const tagsFieldY = useRef(0);

  const canSave = title.trim().length > 0 && selectedTypes.length > 0;

  async function pickVideo() {
    try {
      let uri = null;
      if (Platform.OS === 'android') {
        const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: false });
        if (!result.canceled && result.assets.length > 0 && result.assets[0].uri) {
          uri = result.assets[0].uri;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'videos', allowsEditing: false, quality: 1 });
        if (!result.canceled && result.assets.length > 0 && result.assets[0].uri) {
          uri = result.assets[0].uri;
        }
      }
      if (!uri) return;
      setVideoUri(uri);
      try {
        const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, { time: 0 });
        setThumbnailUri(thumb);
      } catch (_) {
        setThumbnailUri(null);
      }
    } catch (e) {}
  }

  function handleSave() {
    if (!canSave) return;
    const updated = {
      ...video,
      title: title.trim(),
      movementTypes: selectedTypes,
      tags,
      date: formatDate(date),
      description: description.trim(),
      videoUri: videoUri ?? video.videoUri,
      thumbnail: thumbnailUri ?? video.thumbnail,
    };
    // Fire gallery sync in background — doesn't block the save
    syncGalleryInBackground(updated);
    onSave?.(updated);
    navigation.goBack();
  }

  async function syncGalleryInBackground(updated) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (updated.mediaLibraryAssetId) {
        try { await MediaLibrary.deleteAssetsAsync([updated.mediaLibraryAssetId]); } catch (_) {}
      }

      const sanitized = updated.title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'video';
      const tempUri = FileSystem.documentDirectory + `${sanitized}_tmp.mp4`;
      await FileSystem.copyAsync({ from: updated.videoUri, to: tempUri });

      const asset = await MediaLibrary.createAssetAsync(tempUri);

      const album = await MediaLibrary.getAlbumAsync('Movement Log');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Movement Log', asset, false);
      }

      try { await FileSystem.deleteAsync(tempUri, { idempotent: true }); } catch (_) {}
    } catch (_) {}
  }

  function handleClose() { setShowDiscardDialog(true); }
  function handleDiscard() { setShowDiscardDialog(false); navigation.goBack(); }

  function onAndroidChange(event, selected) {
    setShowPicker(false);
    if (event.type === 'set' && selected) setDate(selected);
  }

  function onIosChange(_, selected) { if (selected) setIosTempDate(selected); }
  function confirmIosDate() { setDate(iosTempDate); setShowPicker(false); }
  function openDatePicker() { setIosTempDate(date); setShowPicker(true); }

  function scrollToTagsField() {
    scrollRef.current?.scrollTo({ y: formY.current + tagsFieldY.current - 16, animated: true });
  }
  function scrollToTop() { scrollRef.current?.scrollTo({ y: 0, animated: true }); }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Video</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Video thumbnail / picker */}
          <TouchableOpacity style={styles.videoPicker} onPress={pickVideo} activeOpacity={0.8}>
            {videoUri ? (
              <>
                {thumbnailUri && <Image source={{ uri: thumbnailUri }} style={styles.thumbnailBg} resizeMode="cover" />}
                <View style={[styles.thumbnailOverlay, !thumbnailUri && { backgroundColor: 'transparent' }]} />
                <View style={styles.videoSuccessContent}>
                  <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.videoSuccessLabel}>Tap to change video</Text>
                </View>
              </>
            ) : (
              <View style={styles.videoPickerInner}>
                <View style={styles.videoPickerIcon}>
                  <Ionicons name="cloud-upload-outline" size={36} color={colors.accent} />
                </View>
                <Text style={styles.videoPickerLabel}>Pick a video</Text>
                <Text style={styles.videoPickerHint}>Tap to browse your camera roll</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form fields */}
          <View style={styles.form} onLayout={(e) => { formY.current = e.nativeEvent.layout.y; }}>
            <View style={styles.field}>
              <Text style={styles.label}>Title <Text style={{ color: colors.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Morning windmill practice"
                placeholderTextColor={colors.placeholder}
                returnKeyType="done"
              />
            </View>

            <View style={[styles.field, { zIndex: 20 }]}>
              <Text style={styles.label}>Movement Discipline <Text style={{ color: colors.danger }}>*</Text></Text>
              <TagInput
                selectedTags={selectedTypes}
                onTagsChange={setSelectedTypes}
                predefinedValues={movementDisciplines}
                placeholder="Search disciplines..."
              />
            </View>

            <View style={[styles.field, { zIndex: 10 }]} onLayout={(e) => { tagsFieldY.current = e.nativeEvent.layout.y; }}>
              <Text style={styles.label}>Skills</Text>
              <TagInput
                selectedTags={tags}
                onTagsChange={setTags}
                onFocus={scrollToTagsField}
                onBlur={scrollToTop}
                placeholder="e.g. Side kicks, windmills, front splits, etc."
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={openDatePicker} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {Platform.OS === 'android' && showPicker && (
                <DateTimePicker value={date} mode="date" display="default" onChange={onAndroidChange} maximumDate={new Date()} />
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Notes about this session..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSave && styles.submitBtnDisabled]}
          onPress={handleSave}
          activeOpacity={canSave ? 0.8 : 1}
        >
          <Text style={[styles.submitText, !canSave && styles.submitTextDisabled]}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowPicker(false)} />
            <View style={styles.iosPickerSheet}>
              <View style={[styles.iosPickerHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={[styles.iosPickerCancel, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIosDate}>
                  <Text style={[styles.iosPickerDone, { color: colors.accent }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosTempDate}
                mode="date"
                display="spinner"
                onChange={onIosChange}
                maximumDate={new Date()}
                themeVariant="dark"
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Discard dialog */}
      <Modal visible={showDiscardDialog} transparent animationType="fade" onRequestClose={() => setShowDiscardDialog(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Discard changes?</Text>
            <Text style={styles.dialogSubtitle}>Changes made will not be saved.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setShowDiscardDialog(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dialogBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder }]}
                onPress={handleDiscard}
                activeOpacity={0.8}
              >
                <Text style={[styles.dialogBtnText, { color: colors.danger, fontWeight: '700' }]}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
    },
    headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
    videoPicker: {
      height: 160,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginTop: 20,
      marginBottom: 24,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    thumbnailBg: { ...StyleSheet.absoluteFillObject },
    thumbnailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    videoSuccessContent: { alignItems: 'center', gap: 8 },
    videoSuccessLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
    videoPickerInner: { alignItems: 'center', gap: 8 },
    videoPickerIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    videoPickerLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
    videoPickerHint: { color: colors.textMuted, fontSize: 13 },
    form: { gap: 20 },
    field: { gap: 8 },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textarea: { height: 100, paddingTop: 12 },
    dateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    dateBtnText: { color: colors.text, fontSize: 15 },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      gap: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    submitBtnDisabled: { backgroundColor: colors.surfaceElevated, shadowOpacity: 0, elevation: 0 },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    submitTextDisabled: { color: colors.textMuted },
    iosPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    iosPickerSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 24,
    },
    iosPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    iosPickerCancel: { fontSize: 16 },
    iosPickerDone: { fontSize: 16, fontWeight: '700' },
    iosPicker: { height: 200 },
    dialogOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    dialog: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 24,
      gap: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    dialogTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
    dialogSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
    dialogActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    dialogBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 12,
    },
    dialogBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
