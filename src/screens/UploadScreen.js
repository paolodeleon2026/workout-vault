import React, { useState } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import TagInput from '../components/TagInput';
import { movementTypes } from '../data/placeholderData';

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UploadScreen({ navigation, route }) {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');

  // Date picker visibility
  const [showPicker, setShowPicker] = useState(false);
  // On Android the picker renders inline as a dialog; on iOS we show it in a modal
  const [iosTempDate, setIosTempDate] = useState(new Date());

  const canSubmit = video !== null && title.trim().length > 0 && selectedTypes.length > 0;

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function pickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setVideo(result.assets[0]);
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;

    const newVideo = {
      id: Date.now().toString(),
      title: title.trim(),
      duration: '0:00',
      date: formatDate(date),
      size: video.fileSize
        ? `${(video.fileSize / 1e9).toFixed(1)} GB`
        : 'Unknown',
      thumbnail: video.uri,
      category: null,
      movementTypes: selectedTypes,
      tags,
      description: description.trim(),
    };

    route.params?.onAdd(newVideo);
    navigation.goBack();
  }

  // Android: picker fires onChange directly
  function onAndroidChange(event, selected) {
    setShowPicker(false);
    if (event.type === 'set' && selected) setDate(selected);
  }

  // iOS: picker fires onChange as the user scrolls
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Video picker */}
          <TouchableOpacity
            style={styles.videoPicker}
            onPress={pickVideo}
            activeOpacity={0.8}
          >
            {video ? (
              <>
                {/* Thumbnail behind overlay */}
                <Image source={{ uri: video.uri }} style={styles.thumbnailBg} resizeMode="cover" />
                {/* Dark overlay */}
                <View style={styles.thumbnailOverlay} />
                {/* Success content */}
                <View style={styles.videoSuccessContent}>
                  <Ionicons name="checkmark-circle" size={36} color="#26de81" />
                  <Text style={styles.videoSuccessLabel}>Upload successful</Text>
                  <Text style={styles.videoPickedChange}>Tap to change</Text>
                </View>
              </>
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
          <View style={styles.form}>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Morning windmill practice"
                placeholderTextColor="#555"
                returnKeyType="done"
              />
            </View>

            {/* Movement Type */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Movement Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.typeChips}>
                {movementTypes.map((type) => {
                  const active = selectedTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, active && styles.typeChipActive]}
                      onPress={() => toggleType(type)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedTypes.length === 0 && (
                <Text style={styles.typeHint}>Select at least one</Text>
              )}
            </View>

            {/* Movement Tags */}
            <View style={[styles.field, { zIndex: 10 }]}>
              <Text style={styles.label}>Movement Tags</Text>
              <TagInput selectedTags={tags} onTagsChange={setTags} />
            </View>

            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={openDatePicker} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={18} color="#888" />
                <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
                <Ionicons name="chevron-down" size={16} color="#555" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {/* Android: picker renders as a system dialog directly */}
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

        {/* Submit button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={canSubmit ? 0.8 : 1}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={canSubmit ? '#FFF' : '#444'} />
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
              Upload Video
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#12121E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 18,
  },
  headerTitle: {
    color: '#FFF',
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
    borderColor: '#2A2A3E',
    borderStyle: 'dashed',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E2E',
  },
  thumbnailBg: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  videoSuccessContent: {
    alignItems: 'center',
    gap: 8,
  },
  videoSuccessLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  videoPickedChange: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  videoPickerInner: {
    alignItems: 'center',
    gap: 8,
  },
  videoPickerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C63FF22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  videoPickerLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPickerHint: {
    color: '#555',
    fontSize: 13,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  required: {
    color: '#FF6584',
  },
  input: {
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  textarea: {
    height: 100,
    paddingTop: 12,
  },
  typeChips: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  typeChipActive: {
    backgroundColor: '#6C63FF22',
    borderColor: '#6C63FF',
  },
  typeChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  typeHint: {
    color: '#FF6584',
    fontSize: 12,
    marginTop: 2,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    gap: 10,
  },
  dateBtnText: {
    color: '#FFF',
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#1E1E2E',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submitTextDisabled: {
    color: '#444',
  },
  // iOS date picker modal
  iosPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  iosPickerSheet: {
    backgroundColor: '#1E1E2E',
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
    borderBottomColor: '#2A2A3E',
  },
  iosPickerCancel: {
    color: '#888',
    fontSize: 16,
  },
  iosPickerDone: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '700',
  },
  iosPicker: {
    height: 200,
  },
});
