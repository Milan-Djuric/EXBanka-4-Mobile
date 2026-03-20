import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email je obavezan';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email nije ispravan';
    if (!password) e.password = 'Lozinka je obavezna';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.status === 'PENDING') {
        navigation.navigate('PendingApproval', {
          approvalRequestId: result.approvalRequestId,
          actionType: 'LOGIN',
        });
      }
      // SUCCESS handled by AuthContext — AppNavigator switches to MainTabs automatically
    } catch (err) {
      const msg = err.response?.data?.error || 'Pogrešni podaci';
      Alert.alert('Greška pri prijavi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>EXBanka</Text>
          <Text style={styles.subtitle}>Klijentski portal</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="vas@email.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Lozinka</Text>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Prijavi se</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: '700', color: '#1a3c6e' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  form: {},
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16, color: '#111', backgroundColor: '#fafafa',
  },
  inputError: { borderColor: '#e53e3e' },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    backgroundColor: '#fafafa',
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: '#111' },
  eyeBtn: { paddingHorizontal: 14 },
  eyeText: { fontSize: 18 },
  errorText: { color: '#e53e3e', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#1a3c6e', borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 32,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
