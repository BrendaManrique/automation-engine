//Supported voices
//https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=stt#prebuilt-neural-voices
/*Configure voice style:  
https://speech.microsoft.com/audiocontentcreation */
import {
    SpeechSynthesisOutputFormat,
    SpeechConfig,
    AudioConfig,
    SpeechSynthesizer,
    SpeechSynthesisBoundaryType,
} from 'microsoft-cognitiveservices-speech-sdk';
import path from 'path';

import { error, log } from '../utils/log';
import { getPath } from '../config/defaultPaths';
import InterfaceJsonContent from '../models/InterfaceJsonContent';
import Segment from '../models/Segments';

class TextToSpeechService {
    private voices = [
        { chance: 3, name: 'en-US-AmberNeural' },
        { chance: 3, name: 'en-US-AnaNeural' },
        { chance: 1, name: 'en-US-AriaNeural' },
        { chance: 1, name: 'en-US-BrandonNeural' },
        { chance: 1, name: 'en-US-ChristopherNeural' },
        { chance: 1, name: 'en-US-CoraNeural' },
        { chance: 3, name: 'en-US-DavisNeural' },
        { chance: 3, name: 'en-US-ElizabethNeural' },
        { chance: 1, name: 'en-US-GuyNeural' },
        { chance: 3, name: 'en-US-JacobNeural' },
        { chance: 0, name: 'en-US-JasonNeural' },
        { chance: 0, name: 'en-US-MichelleNeural' },
        { chance: 1, name: 'en-US-MonicaNeural' },
        { chance: 1, name: 'en-US-SaraNeural' },
        { chance: 1, name: 'en-US-TonyNeural' },
    ];
    private azureKey: string;
    private azureRegion: string;
    private voice: string;
    private content: InterfaceJsonContent;

    constructor(content: InterfaceJsonContent) {
        this.content = content;

        if (!process.env.AZURE_TTS_KEY) {
            error('Azure Key is not defined', 'TextToSpeechService');
            return;
        }

        if (!process.env.AZURE_TTS_REGION) {
            error('Azure Region is not defined', 'TextToSpeechService');
            return;
        }

        this.azureKey = process.env.AZURE_TTS_KEY;
        this.azureRegion = process.env.AZURE_TTS_REGION;
        this.content.renderData = [];
    }

    public async execute({
        synthesizeIntro,
        synthesizeEnd,
    }: {
        synthesizeIntro?: boolean;
        synthesizeEnd?: boolean;
    }): Promise<InterfaceJsonContent> {
        const synthesizePromises: Promise<void>[] = [];

        if (synthesizeIntro) {
            synthesizePromises.push(this.synthesizeIntro());
        }

        synthesizePromises.push(this.synthesizeNews());

        await Promise.all(synthesizePromises);

        if (synthesizeEnd) {
            await this.synthesizeEnd()
        }
        log(`${JSON.stringify(this.content)}`, 'TextToSpeechService');
        return this.content;
    }

    private async synthesizeIntro(): Promise<void> {
        if (!this.content.intro?.text) {
            log('Intro text is not defined, skipping...', 'TextToSeechService');
            return;
        }

        if (typeof this.content.renderData !== 'object') {
            error('Render data is not defined', 'TextToSeechService');
            throw new Error('Render data is not defined');
        }

        log(`Synthesizing Intro`, 'TextToSpeechService');
        const { audioFilePath, segments, duration } = await this.synthesize(
            this.content.intro.text,
            'intro',
        );

        this.content.renderData[0] = {
            text: this.content.intro.text,
            duration,
            audioFilePath,
            segments,
        }
    }

    private async synthesizeNews(): Promise<void> {
        const synthesizePromises = this.content.news.map(async (news, index) => {
            log(`Synthesizing news ${index}`, 'TextToSpeechService');

            const { audioFilePath, segments, duration } = await this.synthesize(
                news.text,
                index.toString(),
            );

            if (typeof this.content.renderData !== 'object') {
                error('Render data is not defined', 'TextToSeechService');
                throw new Error('Render data is not defined');
            }

            this.content.renderData[index + 1] = {
                text: news.text,
                duration,
                audioFilePath,
                segments,
            }
        });

        await Promise.all(synthesizePromises);
    }

    private async synthesizeEnd(): Promise<void> {
        if (!this.content.end?.text) {
            log('End text is not defined, skipping...', 'TextToSeechService');
            return;
        }

        if (typeof this.content.renderData !== 'object') {
            error('Render data is not defined', 'TextToSeechService');
            throw new Error('Render data is not defined');
        }

        log('Synthesizing end', 'TextToSpeechService');
        const { audioFilePath, segments, duration } = await this.synthesize(
            this.content.end.text,
            'end',
        );

        this.content.renderData.push({
            text: this.content.end.text,
            duration,
            audioFilePath,
            segments
        });
    }

    private getVoice() {
        const voicesExtended = this.voices.reduce(
            (acc, voice) => [...acc, ...Array(voice.chance).fill(voice.name)],
            [] as string[],
        );

        if (!this.voice) {
            this.voice =
                voicesExtended[Math.floor(Math.random() * voicesExtended.length)];
        } else {
            let newVoice = voicesExtended[Math.floor(Math.random() * voicesExtended.length)];

            while (newVoice === this.voice) {
                newVoice = voicesExtended[Math.floor(Math.random() * voicesExtended.length)];
            }

            this.voice = newVoice;
        }

        return this.voice;
    }

    private getSingleVoice() {
        return 'en-US-JasonNeural';
    }

    private async synthesize(text: string, sufix: string): Promise<{ audioFilePath: string, duration: number, segments: Segment[] }> {
        const tmpPath = await getPath('tmp');
        const segments: Segment[] = []

        return new Promise(resolve => {
            const audioFilePath = path.resolve(tmpPath, `output-${sufix}.mp3`);

            const speechConfig = SpeechConfig.fromSubscription(
                this.azureKey,
                this.azureRegion,
            );

            speechConfig.speechSynthesisOutputFormat =
                SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
            const audioConfig = AudioConfig.fromAudioFileOutput(audioFilePath);

            const ssml = `
                <speak version="1.0" xml:lang="en-US" xmlns:mstts="http://www.w3.org/2001/mstts">
                    <voice name="${this.getSingleVoice()}">
                        <mstts:express-as style="whispering">
                            <prosody rate="-12.00%">
                                <break time="250ms" /> ${text}
                            </prosody>
                        </mstts:express-as>
                    </voice>
                </speak>`;
            //<mstts:express-as style="whispering">
            //</mstts:express-as>
            //<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-JasonNeural"><s /><mstts:express-as style="whispering">This is a new text"</mstts:express-as></voice><voice name="en-US-AriaNeural"><mstts:express-as style="whispering">That’s remarkable! You’re a genius!"Mom said to her son.</mstts:express-as><s />

            const synthesizer = new SpeechSynthesizer(
                speechConfig,
                audioConfig,
            );

            synthesizer.wordBoundary = (s, e) => {
                switch (e.boundaryType) {
                    case SpeechSynthesisBoundaryType.Word:
                        segments.push({
                            start: e.audioOffset / 10000,
                            end: (e.audioOffset + e.duration) / 10000,
                            word: e.text
                        })
                        break;
                    case SpeechSynthesisBoundaryType.Punctuation:
                        segments.push({
                            start: e.audioOffset / 10000,
                            end: (e.audioOffset + e.duration) / 10000,
                            word: e.text
                        })
                        break;
                }
            }

            synthesizer.speakSsmlAsync(
                ssml,
                result => {
                    synthesizer.close();
                    resolve({
                        audioFilePath,
                        duration: result.audioDuration / 10000000, // 100 nanoseconds for each audio duration unit -> to seconds
                        segments
                    });
                },
                err => {
                    synthesizer.close();
                    error(
                        `Synthesize of sentence ${sufix} failed. \n ${err}`,
                        'TextToSpeechService',
                    );
                },
            );
        });
    }
}

export default TextToSpeechService;
