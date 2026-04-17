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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { createVideoPlayer } from 'expo-video';
import DateTimePicker from '@react-native-community/datetimepicker';
import TagInput from '../components/TagInput';
import { movementDisciplines } from '../data/placeholderData';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../theme';

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(secs) {
  if (!secs || secs <= 0) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function extractDuration(uri) {
  return new Promise((resolve) => {
    const player = createVideoPlayer({ uri });
    const timeout = setTimeout(() => {
      try { player.release(); } catch (_) {}
      resolve('0:00');
    }, 8000);
    const sub = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        clearTimeout(timeout);
        sub.remove();
        const formatted = formatDuration(player.duration);
        try { player.release(); } catch (_) {}
        resolve(formatted);
      } else if (status.status === 'error') {
        clearTimeout(timeout);
        sub.remove();
        try { player.release(); } catch (_) {}
        resolve('0:00');
      }
    });
  });
}

export default function UploadScreen({ navigation, route }) {
  const { colors, wifiOnly } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [video, setVideo] = useState(null);
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [duration, setDuration] = useState('0:00');
  const [title, setTitle] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [iosTempDate, setIosTempDate] = useState(new Date());

  const scrollRef = useRef(null);
  const formY = useRef(0);
  const tagsFieldY = useRef(0);

  const canSubmit = video !== null && title.trim().length > 0 && selectedTypes.length > 0;

  async function pickVideo() {
    try {
      if (wifiOnly) {
        const state = await NetInfo.fetch();
        if (state.type !== 'wifi') {
          Alert.alert(
            'Wi-Fi Required',
            'Wi-Fi Only is enabled in Settings. Connect to Wi-Fi to upload videos.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      let uri = null;
      let fileSize = null;

      if (Platform.OS === 'android') {
        // copyToCacheDirectory: true gives a file:// URI that FileSystem can read
        const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
        if (!result.canceled && result.assets.length > 0 && result.assets[0].uri) {
          uri = result.assets[0].uri;
          fileSize = result.assets[0].size ?? null;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'videos', allowsEditing: false, quality: 1 });
        if (!result.canceled && result.assets.length > 0 && result.assets[0].uri) {
          uri = result.assets[0].uri;
          fileSize = result.assets[0].fileSize ?? null;
        }
      }

      if (!uri) return;

      // Copy video into documentDirectory (permanent storage that survives restarts)
      const videoExt = uri.match(/\.(\w+)(?:\?|$)/)?.[1] ?? 'mp4';
      const permanentVideoUri = FileSystem.documentDirectory + `video_${Date.now()}.${videoExt}`;
      await FileSystem.copyAsync({ from: uri, to: permanentVideoUri });

      setVideo({ uri: permanentVideoUri, fileSize });

      // Generate thumbnail from the permanent copy, then persist it too
      try {
        const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(permanentVideoUri, { time: 0 });
        const permanentThumbUri = FileSystem.documentDirectory + `thumb_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: thumb, to: permanentThumbUri });
        setThumbnailUri(permanentThumbUri);
      } catch (_) {
        setThumbnailUri(null);
      }

      const dur = await extractDuration(permanentVideoUri);
      setDuration(dur);
    } catch (e) {
      // silently ignore picker errors
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    let mediaLibraryAssetId = null;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        // Copy video to a temp file named after the title so the gallery entry has a readable name
        const sanitized = title.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'video';
        const tempUri = FileSystem.documentDirectory + `${sanitized}_tmp.mp4`;
        await FileSystem.copyAsync({ from: video.uri, to: tempUri });

        const asset = await MediaLibrary.createAssetAsync(tempUri);

        // Create or reuse the "Movement Log" album
        const album = await MediaLibrary.getAlbumAsync('Movement Log');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Movement Log', asset, false);
        }

        mediaLibraryAssetId = asset.id;
        try { await FileSystem.deleteAsync(tempUri, { idempotent: true }); } catch (_) {}
      }
    } catch (_) {}

    const newVideo = {
      id: Date.now().toString(),
      title: title.trim(),
      duration,
      date: formatDate(date),
      size: video.fileSize ? `${(video.fileSize / 1e9).toFixed(1)} GB` : 'Unknown',
      videoUri: video.uri,
      thumbnail: thumbnailUri,
      category: null,
      movementTypes: selectedTypes,
      tags,
      description: description.trim(),
      mediaLibraryAssetId,
    };
    route.params?.onAdd(newVideo);
    navigation.goBack();
  }

  function onAndroidChange(event, selected) {
    setShowPicker(false);
    if (event.type === 'set' && selected) setDate(selected);
  }

  function onIosChange(_, selected) {
    if (selected) setIosTempDate(selected);
  }

  function confirmIosDate() {
    setDate(iosTempDate);
    setShowPicker(false);
  }

  function openDatePicker() {
    setIosTempDate(date);
    setShowPicker(true);
  }

  function scrollToTagsField() {
    scrollRef.current?.scrollTo({ y: formY.current + tagsFieldY.current - 16, animated: true });
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Video picker */}
          <TouchableOpacity style={styles.videoPicker} onPress={pickVideo} activeOpacity={0.8}>
            {video ? (
              <>
                {thumbnailUri && <Image source={{ uri: thumbnailUri }} style={styles.thumbnailBg} resizeMode="cover" />}
                <View style={[styles.thumbnailOverlay, !thumbnailUri && { backgroundColor: 'transparent' }]} />
                <View style={styles.videoSuccessContent}>
                  <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                  <Text style={styles.videoSuccessLabel}>Video selected</Text>
                  <Text style={styles.videoPickedChange}>Tap to change</Text>
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

      {/* Submit button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={canSubmit ? 0.8 : 1}
        >
          <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
            Upload Video
          </Text>
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
    headerTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
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
    videoSuccessLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    videoPickedChange: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    submitBtnDisabled: {
      backgroundColor: colors.surfaceElevated,
      shadowOpacity: 0,
      elevation: 0,
    },
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
  });
}
