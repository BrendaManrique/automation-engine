import {
    interpolate,
    Sequence,
    useCurrentFrame,
    useVideoConfig,
    getInputProps,
    random,
    Audio, 
    Video,
    staticFile,
    AbsoluteFill
} from 'remotion';
import { Title } from './Podcast/Title';
import { AudioWaveform } from './Podcast/AudioWaveform';
import { Transition } from './Podcast/Transition';
import { Logo } from './Podcast/Logo';
import { Intro } from './Podcast/Intro';
import { Wrapper } from './Wrappers/index';
import InterfaceJsonContent from '../../src/models/InterfaceJsonContent';
import meditation from '../../assets/meditation1.mp3';
import background from '../../assets/background1.mp4';
import introBackground from '../../assets/intro_background.jpg';

const { withoutIntro } = getInputProps();

export const Main: React.FC<{
    content: InterfaceJsonContent
}> = ({ content: { renderData, date, title, youtube } }) => {
    if (!renderData) {
        throw new Error('Missing renderData');
    }

    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const transitionDurationInFrames = 2.9 * fps;
    const showWrapperOnIndex =
        renderData.length > 2
            ? Math.floor(random(title) * (renderData.length - 2 - 2) + 2) //Valor randomico entre 2 e (quantidade de noticias - final - ultima noticia)
            : -1; //If have less then 2 news will not show wrapper

    let initialFrame = 70;
    let nextInitialFrame = initialFrame;

    const opacity = interpolate(
        frame,
        [durationInFrames - 30, durationInFrames - 10],
        [1, 0],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        },
    );

    const opacityIntro = interpolate(
		frame,
        [0, 10, nextInitialFrame - 20, nextInitialFrame],
        [0, 1, 1, 0],
		{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'extend',
		},
	);

    const opacityBackground = interpolate(
		frame,
        [nextInitialFrame - 20, nextInitialFrame],
        [ 1, 0],
		{
				extrapolateRight: 'extend',
		},
	);

    /*const backgroundColor = interpolate(
        frame,
        [0, nextInitialFrame],
        //@ts-ignore 
        ['#000000', '#2193b0']
      );*/

    

    return (
        <div style={{flex: 1,}} >
            <Sequence from={0}><Audio src={meditation}  loop={true} volume={0.2}/></Sequence>
            <Sequence from={initialFrame/2}><Video src={background}  loop={true}/></Sequence>
            
            <div style={{ opacity }}>
                <AbsoluteFill
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        fontSize: 100,
                        fontFamily: 'nunito',
                    }}
                >
                <div style={{
                    top:0,
                    left:0,
                    position:'absolute',
                }}><Logo /></div>
                <Sequence
                            key={`0-Initial`}
                            from={0}
                            durationInFrames={initialFrame}
                    >
                        <div
                                style={{
                                    background: 'black',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    opacity:opacityBackground
                                }}
                            >
                        <div
                                style={{
                                    background: 'linear-gradient(to bottom, #2193b0, #a6fbff)',
                                    backgroundImage: `url(${introBackground})`,
                                    backgroundSize: '100% 100%',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    opacity: opacityIntro
                                }}
                            >
                            <h3 style={{
                                    fontFamily: 'Nunito',
                                    alignSelf: 'center',
                                    margin: 0,
                                    textAlign: 'center',
                                    color: '#ffffffd1'
                                    //fontVariant: 'all-small-caps'
                                }}
                            >Welcome to <br/> The Daily Calm  
                            </h3>
                        </div>
                        </div>
                    </Sequence>
                    
                </AbsoluteFill>

                {renderData.map((prop, index) => {
                    const textDuration = Math.round(prop.duration * fps);

                    initialFrame = nextInitialFrame;
                    nextInitialFrame =
                        initialFrame +
                        transitionDurationInFrames +
                        textDuration;

                    if (index === 0 && !withoutIntro) {
                        return (
                            <>
                                <Sequence
                                    key={`${initialFrame}-Intro`}
                                    from={initialFrame}
                                    durationInFrames={textDuration}
                                >
                                    <Intro
                                        date={date}
                                        audioFilePath={prop.audioFilePath}
                                        title={title}
                                        details={{subscribers: youtube?.subscriberCount }}
                                    />
                                    <Logo />
                                </Sequence>
                                {/*index < renderData.length - 1 ? (
                                    <Sequence
                                        key={`${initialFrame}-Transition`}
                                        from={initialFrame + textDuration}
                                        durationInFrames={
                                            transitionDurationInFrames
                                        }
                                    >
                                        <Transition />
                                    </Sequence>
                                    ) : null*/}
                            </>
                        );
                    }

                    return (
                        <>
                            <Sequence
                                key={`${initialFrame}-Title`}
                                from={initialFrame}
                                durationInFrames={textDuration}
                            >
                                <Wrapper
                                    title={title}
                                    show={index === showWrapperOnIndex}
                                >
                                    <Logo />
                                    <Title segments={prop.segments} />
                                    <AudioWaveform
                                        audioFilePath={prop.audioFilePath}
                                    />
                                </Wrapper>
                            </Sequence>
                            {/*index < renderData.length - 1 ? (
                                <Sequence
                                    key={`${initialFrame}-Transition`}
                                    from={initialFrame + textDuration}
                                    durationInFrames={
                                        transitionDurationInFrames
                                    }
                                >
                                    <Transition />
                                </Sequence>
                                ) : null*/}
                        </>
                    );
                })}

            </div>
        </div>
    );
};
