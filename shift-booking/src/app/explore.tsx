import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Shift = {
  id: string;
  booked: boolean;
  area: string;
  startTime: number;
  endTime: number;
};

const API_URL = 'http://127.0.0.1:8080';

const CITIES = [
  {
    name: 'Helsinki',
    icon: '🏛️',
  },
  {
    name: 'Tampere',
    icon: '🏙️',
  },
  {
    name: 'Turku',
    icon: '🏰',
  },
];

export default function AvailableShiftsScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedCity, setSelectedCity] =
    useState('Helsinki');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] =
    useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShifts();
  }, []);

  async function fetchShifts() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/shifts`
      );

      if (!response.ok) {
        throw new Error(
          'Failed to fetch shifts'
        );
      }

      const data = await response.json();

      setShifts(data);
    } catch (err) {
      console.error(err);
      setError('Could not load shifts.');
    } finally {
      setLoading(false);
    }
  }

  async function bookShift(id: string) {
    try {
      setBookingId(id);

      const response = await fetch(
        `${API_URL}/shifts/${id}/book`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not book shift'
        );
      }

      setShifts((currentShifts) =>
        currentShifts.map((shift) =>
          shift.id === id
            ? {
                ...shift,
                booked: true,
              }
            : shift
        )
      );
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : 'Could not book shift';

      Alert.alert(
        'Booking failed',
        message
      );
    } finally {
      setBookingId(null);
    }
  }

  function formatTime(timestamp: number) {
    return new Date(
      timestamp
    ).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  function formatDate(timestamp: number) {
    return new Date(
      timestamp
    ).toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function getCityCount(city: string) {
    return shifts.filter(
      (shift) =>
        shift.area === city &&
        !shift.booked
    ).length;
  }

  function getDuration(
    startTime: number,
    endTime: number
  ) {
    const hours =
      (endTime - startTime) /
      (1000 * 60 * 60);

    if (Number.isInteger(hours)) {
      return `${hours} ${
        hours === 1 ? 'hour' : 'hours'
      }`;
    }

    return `${hours.toFixed(1)} hours`;
  }

  const filteredShifts = useMemo(() => {
    return shifts
      .filter(
        (shift) =>
          shift.area === selectedCity &&
          !shift.booked
      )
      .sort(
        (a, b) =>
          a.startTime - b.startTime
      );
  }, [shifts, selectedCity]);

  const groupedShifts = useMemo(() => {
    const groups: Record<
      string,
      Shift[]
    > = {};

    filteredShifts.forEach((shift) => {
      const dateKey = new Date(
        shift.startTime
      ).toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(shift);
    });

    return groups;
  }, [filteredShifts]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading shifts...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={fetchShifts}
        >
          <Text style={styles.retryText}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          '#1769E8',
          '#4B4BEF',
          '#7762F3',
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.calendarIcon}>
            <Text
              style={styles.calendarIconText}
            >
              ▣
            </Text>
          </View>

          <View style={styles.availabilityBadge}>
            <Text
              style={styles.peopleIcon}
            >
              ●●
            </Text>

            <View>
              <Text
                style={
                  styles.availabilityNumber
                }
              >
                {filteredShifts.length}{' '}
                available
              </Text>

              <Text
                style={
                  styles.availabilitySubtext
                }
              >
                shifts in {selectedCity}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.heroTitleContainer}>
          <Text style={styles.heroTitle}>
            Available Shifts
          </Text>

          <Text
            style={styles.heroSubtitle}
          >
            Choose a city and book your next
            shift
          </Text>
        </View>

        <View style={styles.cityCards}>
          {CITIES.map((city) => {
            const isSelected =
              selectedCity === city.name;

            return (
              <Pressable
                key={city.name}
                onPress={() =>
                  setSelectedCity(
                    city.name
                  )
                }
                style={[
                  styles.cityCard,
                  isSelected &&
                    styles.selectedCityCard,
                ]}
              >
                <Text
                  style={styles.cityIcon}
                >
                  {city.icon}
                </Text>

                <View
                  style={
                    styles.cityCardText
                  }
                >
                  <Text
                    style={[
                      styles.cityName,
                      isSelected &&
                        styles.selectedCityName,
                    ]}
                  >
                    {city.name}
                  </Text>

                  <Text
                    style={[
                      styles.cityShiftCount,
                      isSelected &&
                        styles.selectedCityCount,
                    ]}
                  >
                    {getCityCount(
                      city.name
                    )}{' '}
                    shifts
                  </Text>
                </View>

                <Text
                  style={[
                    styles.cityArrow,
                    isSelected &&
                      styles.selectedCityArrow,
                  ]}
                >
                  ›
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.skyline}>
          <Text style={styles.skylineText}>
            ⛪ 🏢 🏛️ 🏢
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.contentArea}>
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {Object.keys(groupedShifts)
            .length === 0 ? (
            <View style={styles.emptyBox}>
              <Text
                style={styles.emptyIcon}
              >
                —
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                No available shifts
              </Text>

              <Text
                style={styles.emptyText}
              >
                There are no available
                shifts in {selectedCity}.
              </Text>
            </View>
          ) : (
            Object.entries(
              groupedShifts
            ).map(
              ([date, dateShifts]) => (
                <View
                  key={date}
                  style={styles.dateSection}
                >
                  <View
                    style={styles.dateHeader}
                  >
                    <View
                      style={
                        styles.dateIconBox
                      }
                    >
                      <Text
                        style={
                          styles.dateIcon
                        }
                      >
                        ▣
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.dateTitle
                      }
                    >
                      {formatDate(
                        dateShifts[0]
                          .startTime
                      )}
                    </Text>

                    <Text
                      style={
                        styles.dateShiftCount
                      }
                    >
                      {dateShifts.length}{' '}
                      {dateShifts.length ===
                      1
                        ? 'shift'
                        : 'shifts'}
                    </Text>

                    <Text
                      style={
                        styles.collapseIcon
                      }
                    >
                      ⌃
                    </Text>
                  </View>

                  <View
                    style={styles.shiftList}
                  >
                    {dateShifts.map(
                      (shift) => (
                        <View
                          key={shift.id}
                          style={
                            styles.shiftCard
                          }
                        >
                          <View
                            style={
                              styles.clockBox
                            }
                          >
                            <Text
                              style={
                                styles.clockIcon
                              }
                            >
                              ◷
                            </Text>
                          </View>

                          <View
                            style={
                              styles.shiftMain
                            }
                          >
                            <Text
                              style={
                                styles.shiftTime
                              }
                            >
                              {formatTime(
                                shift.startTime
                              )}{' '}
                              -{' '}
                              {formatTime(
                                shift.endTime
                              )}
                            </Text>

                            <View
                              style={
                                styles.locationRow
                              }
                            >
                              <Text
                                style={
                                  styles.pinIcon
                                }
                              >
                                ●
                              </Text>

                              <Text
                                style={
                                  styles.locationText
                                }
                              >
                                {shift.area}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={
                              styles.verticalDivider
                            }
                          />

                          <View
                            style={
                              styles.durationBox
                            }
                          >
                            <Text
                              style={
                                styles.sunIcon
                              }
                            >
                              ☀
                            </Text>

                            <Text
                              style={
                                styles.durationText
                              }
                            >
                              {getDuration(
                                shift.startTime,
                                shift.endTime
                              )}
                            </Text>
                          </View>

                          <Pressable
                            style={[
                              styles.bookButton,
                              bookingId ===
                                shift.id &&
                                styles.disabledButton,
                            ]}
                            disabled={
                              bookingId ===
                              shift.id
                            }
                            onPress={() =>
                              bookShift(
                                shift.id
                              )
                            }
                          >
                            {bookingId ===
                            shift.id ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <>
                                <Text
                                  style={
                                    styles.bookText
                                  }
                                >
                                  Book
                                </Text>

                                <Text
                                  style={
                                    styles.bookArrow
                                  }
                                >
                                  ›
                                </Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )
            )
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FD',
  },

  hero: {
    paddingTop: 85,
    paddingHorizontal: 34,
    paddingBottom: 24,
    minHeight: 320,
    position: 'relative',
    overflow: 'hidden',
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  calendarIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor:
      'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarIconText: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },

  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.28)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },

  peopleIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: -3,
  },

  availabilityNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  availabilitySubtext: {
    color: '#E0E7FF',
    fontSize: 10,
    marginTop: 2,
  },

  heroTitleContainer: {
    marginBottom: 20,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  heroSubtitle: {
    color: '#E8ECFF',
    fontSize: 15,
    marginTop: 5,
  },

  cityCards: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 2,
  },

  cityCard: {
    flex: 1,
    minHeight: 82,
    backgroundColor:
      'rgba(255,255,255,0.22)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.32)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  selectedCityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    shadowColor: '#102A70',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  cityIcon: {
    fontSize: 29,
    marginRight: 9,
  },

  cityCardText: {
    flex: 1,
  },

  cityName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  selectedCityName: {
    color: '#1769E8',
  },

  cityShiftCount: {
    color: '#DCE5FF',
    fontSize: 11,
    marginTop: 4,
  },

  selectedCityCount: {
    color: '#61708C',
  },

  cityArrow: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '300',
  },

  selectedCityArrow: {
    color: '#1769E8',
  },

  skyline: {
    position: 'absolute',
    right: 22,
    bottom: 8,
    opacity: 0.23,
  },

  skylineText: {
    fontSize: 60,
  },

  contentArea: {
    flex: 1,
    marginTop: -2,
    backgroundColor: '#F4F7FD',
  },

  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 45,
  },

  dateSection: {
    marginBottom: 25,
  },

  dateHeader: {
    minHeight: 64,
    backgroundColor: '#EAF0FF',
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 11,
  },

  dateIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E2E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  dateIcon: {
    color: '#514BEF',
    fontSize: 20,
    fontWeight: '800',
  },

  dateTitle: {
    flex: 1,
    color: '#18233D',
    fontSize: 16,
    fontWeight: '800',
  },

  dateShiftCount: {
    color: '#5C6C8A',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 12,
  },

  collapseIcon: {
    color: '#40537C',
    fontSize: 22,
    fontWeight: '700',
  },

  shiftList: {
    gap: 9,
  },

  shiftCard: {
    minHeight: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EDF0F7',
    shadowColor: '#52627E',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },

  clockBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  clockIcon: {
    color: '#1769E8',
    fontSize: 27,
    fontWeight: '700',
  },

  shiftMain: {
    flex: 1,
    minWidth: 150,
  },

  shiftTime: {
    color: '#15213B',
    fontSize: 16,
    fontWeight: '800',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  pinIcon: {
    color: '#6D7B97',
    fontSize: 9,
    marginRight: 6,
  },

  locationText: {
    color: '#71809D',
    fontSize: 13,
  },

  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E6EE',
    marginHorizontal: 18,
  },

  durationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },

  sunIcon: {
    color: '#F8B51B',
    fontSize: 21,
    marginRight: 8,
  },

  durationText: {
    color: '#7887A2',
    fontSize: 13,
    fontWeight: '600',
  },

  bookButton: {
    minWidth: 112,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#1769E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#1769E8',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 9,
    elevation: 4,
  },

  bookText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  bookArrow: {
    color: '#FFFFFF',
    fontSize: 23,
    marginLeft: 9,
    marginTop: -2,
  },

  disabledButton: {
    opacity: 0.65,
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5EAF4',
  },

  emptyIcon: {
    fontSize: 32,
    color: '#8B98B1',
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#25304A',
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 14,
    color: '#77849D',
    textAlign: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FD',
  },

  loadingText: {
    marginTop: 12,
    color: '#66748E',
  },

  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: '#1769E8',
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 20,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});