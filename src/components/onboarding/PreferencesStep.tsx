
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Thermometer, Music, MessageCircle, MapPin, NotebookPen } from 'lucide-react';

export interface PassengerPreferences {
  air_conditioning: boolean;
  preferred_temperature: number;
  temperature_unit: string;
  radio_on: boolean;
  preferred_music: string;
  conversation_preference: string;
  trip_purpose: string;
  trip_notes: string;
}

interface PreferencesStepProps {
  preferences: PassengerPreferences;
  onPreferencesChange: (preferences: PassengerPreferences) => void;
}

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  preferences,
  onPreferencesChange
}) => {
  const updatePreference = <K extends keyof PassengerPreferences>(
    key: K,
    value: PassengerPreferences[K]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Suas preferências
        </h3>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a proporcionar a melhor experiência de viagem para você
        </p>
      </div>

      <div className="space-y-6">
        {/* Temperatura */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Temperatura</Label>
          </div>
          
          <div className="flex items-center space-x-4">
            <Label htmlFor="air-conditioning" className="text-sm">
              Ar condicionado
            </Label>
            <Switch
              id="air-conditioning"
              checked={preferences.air_conditioning}
              onCheckedChange={(checked) => updatePreference('air_conditioning', checked)}
            />
          </div>

          {preferences.air_conditioning && (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                Temperatura preferida: {preferences.preferred_temperature}°{preferences.temperature_unit}
              </Label>
              <div className="px-2">
                <Slider
                  value={[preferences.preferred_temperature]}
                  onValueChange={(value) => updatePreference('preferred_temperature', value[0])}
                  max={85}
                  min={60}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>60°F</span>
                  <span>85°F</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Música */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Music className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Música</Label>
          </div>
          
          <div className="flex items-center space-x-4">
            <Label htmlFor="radio-on" className="text-sm">
              Gosta de música durante a viagem
            </Label>
            <Switch
              id="radio-on"
              checked={preferences.radio_on}
              onCheckedChange={(checked) => updatePreference('radio_on', checked)}
            />
          </div>

          {preferences.radio_on && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Estilo preferido</Label>
              <Select
                value={preferences.preferred_music}
                onValueChange={(value) => updatePreference('preferred_music', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">Sem preferência</SelectItem>
                  <SelectItem value="classical">Clássica</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="electronic">Eletrônica</SelectItem>
                  <SelectItem value="off">Prefiro silêncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Conversação */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Conversação</Label>
          </div>
          
          <RadioGroup
            value={preferences.conversation_preference}
            onValueChange={(value) => updatePreference('conversation_preference', value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="friendly" id="friendly" />
              <Label htmlFor="friendly" className="text-sm">
                😊 Gosto de conversar durante a viagem
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quiet" id="quiet" />
              <Label htmlFor="quiet" className="text-sm">
                🤫 Prefiro viagens silenciosas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no_preference" id="no_pref" />
              <Label htmlFor="no_pref" className="text-sm">
                🤷‍♂️ Depende do meu humor
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Propósito da viagem */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Propósito principal das suas viagens</Label>
          </div>
          
          <Select
            value={preferences.trip_purpose}
            onValueChange={(value) => updatePreference('trip_purpose', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o propósito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Negócios</SelectItem>
              <SelectItem value="leisure">Lazer</SelectItem>
              <SelectItem value="airport">Aeroporto</SelectItem>
              <SelectItem value="event">Eventos</SelectItem>
              <SelectItem value="medical">Médico</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notas adicionais */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <NotebookPen className="w-5 h-5 text-primary" />
            <Label className="text-base font-medium">Observações especiais (opcional)</Label>
          </div>
          
          <Textarea
            placeholder="Alguma observação especial, alergia, ou pedido específico..."
            value={preferences.trip_notes}
            onChange={(e) => updatePreference('trip_notes', e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
};
