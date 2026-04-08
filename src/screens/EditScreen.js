import React, { useState, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import TagInput from '../components/TagInput';
import { movementDisciplines } from '../data/placeholderData';

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function EditScreen({ navigation, route }) {
  const { video, onSave } = route.params;

  const [thumbnail, setThumbnail] = useState(video.thumbnail);
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setThumbnail(asset.uri);
        }
      }
    } catch (e) {
      // Edited or iCloud videos can fail to export — silently ignore
    }
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
      thumbnail: null,
    };
    onSave?.(updated);
    navigation.goBack();
  }

  function handleClose() {
    setShowDiscardDialog(true);
  }

  function handleDiscard() {
    setShowDiscardDialog(false);
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Video</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Video thumbnail / picker */}
          <TouchableOpacity style={styles.videoPicker} onPress={pickVideo} activeOpacity={0.8}>
            {thumbnail ? (
              <View style={styles.videoSuccessContent}>
                <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.9)" />
                <Text style={styles.videoSuccessLabel}>Tap to change video</Text>
              </View>
            ) : (
              <View style={styles.videoPickerInner}>
                <View style={styles.videoPickerIcon}>
                  <Ionicons name="cloud-upload-outline" size={36} color="#6C63FF" />
                </View>
                <Text style={styles.videoPickerLabel}>Pick a video</Text>
                <Text style={styles.videoPickerHint}>Tap to browse your camera roll</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form fields */}
          <View style={styles.form} onLayout={(e) => { formY.current = e.nativeEvent.layout.y; }}>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Morning windmill practice"
                placeholderTextColor="#555"
                returnKeyType="done"
              />
            </View>

            {/* Movement Discipline */}
            <View style={[styles.field, { zIndex: 20 }]}>
              <Text style={styles.label}>Movement Discipline <Text style={styles.required}>*</Text></Text>
              <TagInput
                selectedTags={selectedTypes}
                onTagsChange={setSelectedTypes}
                predefinedValues={movementDisciplines}
                placeholder="Search disciplines..."
              />
            </View>

            {/* Movement Tags */}
            <View
              style={[styles.field, { zIndex: 10 }]}
              onLayout={(e) => { tagsFieldY.current = e.nativeEvent.layout.y; }}
            >
              <Text style={styles.label}>Skills</Text>
              <TagInput
                selectedTags={tags}
                onTagsChange={setTags}
                onFocus={scrollToTagsField}
                onBlur={scrollToTop}
                placeholder="e.g. Side kicks, windmills, front splits, etc."
              />
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={openDatePicker} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={18} color="#888" />
                <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
                <Ionicons name="chevron-down" size={16} color="#555" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {Platform.OS === 'android' && showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onAndroidChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Notes about this session..."
                placeholderTextColor="#555"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button — outside KeyboardAvoidingView so keyboard slides under it */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSave && styles.submitBtnDisabled]}
          onPress={handleSave}
          activeOpacity={canSave ? 0.8 : 1}
        >
          <Ionicons name="checkmark" size={20} color={canSave ? '#FFF' : '#444'} />
          <Text style={[styles.submitText, !canSave && styles.submitTextDisabled]}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </View>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.iosPickerOverlay}>
            <TouchableOpacity style={styles.iosPickerBackdrop} onPress={() => setShowPicker(false)} />
            <View style={styles.iosPickerSheet}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.iosPickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIosDate}>
                  <Text style={styles.iosPickerDone}>Done</Text>
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

      {/* Discard changes dialog */}
      <Modal visible={showDiscardDialog} transparent animationType="fade" onRequestClose={() => setShowDiscardDialog(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Discard changes?</Text>
            <Text style={styles.dialogSubtitle}>Changes made will not be saved.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setShowDiscardDialog(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnDiscard]}
                onPress={handleDiscard}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogBtnDiscardText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121E' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E1E2E', borderRadius: 18,
  },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  videoPicker: {
    height: 160, borderRadius: 16, borderWidth: 2,
    borderColor: '#2A2A3E', borderStyle: 'dashed',
    marginBottom: 24, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E1E2E',
  },
  videoSuccessContent: { alignItems: 'center', gap: 8 },
  videoSuccessLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  videoPickerInner: { alignItems: 'center', gap: 8 },
  videoPickerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#6C63FF22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  videoPickerLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  videoPickerHint: { color: '#555', fontSize: 13 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { color: '#AAA', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  required: { color: '#FF6584' },
  input: {
    backgroundColor: '#1E1E2E', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#2A2A3E',
  },
  textarea: { height: 100, paddingTop: 12 },
  typeHint: { color: '#FF6584', fontSize: 12, marginTop: 2 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E2E', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#2A2A3E', gap: 10,
  },
  dateBtnText: { color: '#FFF', fontSize: 15 },
  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1E1E2E' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 16, gap: 8,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: '#1E1E2E', shadowOpacity: 0, elevation: 0 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  submitTextDisabled: { color: '#444' },
  iosPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  iosPickerBackdrop: { ...StyleSheet.absoluteFillObject },
  iosPickerSheet: { backgroundColor: '#1E1E2E', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  iosPickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#2A2A3E',
  },
  iosPickerCancel: { color: '#888', fontSize: 16 },
  iosPickerDone: { color: '#6C63FF', fontSize: 16, fontWeight: '700' },
  iosPicker: { height: 200 },
  // Discard dialog
  dialogOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  dialog: {
    width: '100%', backgroundColor: '#1E1E2E',
    borderRadius: 18, padding: 24, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  dialogTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  dialogSubtitle: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12,
  },
  dialogBtnCancel: { backgroundColor: '#2A2A3E' },
  dialogBtnCancelText: { color: '#CCC', fontSize: 15, fontWeight: '600' },
  dialogBtnDiscard: { backgroundColor: '#FF658422', borderWidth: 1, borderColor: '#FF658455' },
  dialogBtnDiscardText: { color: '#FF6584', fontSize: 15, fontWeight: '700' },
});
