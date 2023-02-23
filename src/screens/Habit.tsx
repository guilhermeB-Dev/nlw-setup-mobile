import { generateProgressPercentage } from "../utils/generate-progress-percentage";
import { ScrollView, View, Text, Alert } from "react-native";
import { HabitsEmpty } from "../components/HabitsEmpty";
import { ProgressBar } from "../components/ProgressBar";
import { BackButton } from "../components/BackButton";
import { useRoute } from "@react-navigation/native";
import { Cheackbox } from "../components/Checkbox";
import { Loading } from "../components/Loading";
import { useEffect, useState } from "react";
import { api } from "../lib/axios";
import dayjs from "dayjs";
import clsx from "clsx";

interface Params {
  date: string;
}

interface DayInfo {
  completedHabit: string[];
  possibleHabits: {
    id: string;
    title: string;
  }[],
}

export function Habit() {
  const [ loading, setLoading ] = useState(true);
  const [ dayInfo, setDayInfo ] = useState<DayInfo | null>(null);
  const [ completedHabits, setCompletedHabits ] = useState<string[]>([]);
  const route = useRoute();
  const { date } = route.params as Params;

  const parseDate = dayjs(date);
  const isDateInPast = parseDate.endOf('day').isBefore(new Date());
  const dayOfWeek = parseDate.format('dddd');
  const dayAndMonth = parseDate.format('DD/MM');

  const habitsProgress = dayInfo?.possibleHabits.length ? generateProgressPercentage(dayInfo?.possibleHabits.length, completedHabits.length) : 0;

  async function fecthHabits() {
    try {
      setLoading(true);
      const response = await api.get('/day', {params: { date }});
      setDayInfo(response.data);
      setCompletedHabits(response.data.completedHabits);
    } catch(error) {
      console.log(error);
      Alert.alert('Ops', 'Não foi possível carregar as insformações dos hábitos');
    } finally {
      setLoading(false);
    }
  }

  async function toggleHabit(habitId: string) {
    try {
      await api.patch(`/habits/${habitId}/toggle`);
      if(completedHabits.includes(habitId)) {
        setCompletedHabits(prevState => prevState.filter(habit => habit !== habitId));
      } else {
        setCompletedHabits(prevState => [...prevState, habitId]);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Ops', 'Não foi possível atualizar o status do hábito')
    }
  }

  useEffect(() => {
    fecthHabits()
  }, []);

  if(loading) {
    return(<Loading />)
  }

  return(
    <View className="flex-1 bg-background px-8 pt-16">
      <ScrollView showsVerticalScrollIndicator={ false } contentContainerStyle={{ paddingBottom: 50 }}>
        <BackButton />

        <Text className="mt-6 text-zinc-400 font-semibold text-base lowercase">
          { dayOfWeek }
        </Text>

        <Text className="text-white font-extrabold text-3xl">
          { dayAndMonth }
        </Text>

        <ProgressBar progress={ habitsProgress } />

        <View className={clsx("mt-6", {
            ['opacity-60'] : isDateInPast
          })}>
          { 
            dayInfo?.possibleHabits ? 
            dayInfo?.possibleHabits.map(habit => (
                <Cheackbox key={habit.id} title={habit.title} 
                  checked={completedHabits.includes(habit.id)} 
                  disabled={isDateInPast}
                  onPress={() => toggleHabit(habit.id)} />
              )
            ) :
            <HabitsEmpty />
          }
        </View>
        {
          isDateInPast && (
            <Text className="text-white mt-10 text-center">
              Você não pode editar hábitos de uma data passada.
            </Text>
          )
        }
      </ScrollView>
    </View>
  )
}