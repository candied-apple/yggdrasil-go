/*
 * Copyright (C) 2023. Gardel <sunxinao@hotmail.com> and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import Button from '@mui/material/Button';
import {
    Box,
    Collapse,
    Container,
    FilledInput,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    Paper,
    TextField
} from '@mui/material';
import {Visibility, VisibilityOff} from '@mui/icons-material';
import {AppState} from './types';
import './login.css';
import {SubmitHandler, useForm} from 'react-hook-form';
import axios from 'axios';
import {useSnackbar} from 'notistack';
import {FocusedShowHelperText} from './components';

type Inputs = {
    username: string,
    profileName: string,
    password: string
};

function Login(props: { appData: AppState, setAppData: React.Dispatch<React.SetStateAction<AppState>> }) {
    const {appData, setAppData} = props;
    const {enqueueSnackbar} = useSnackbar();
    const {register, handleSubmit, formState: {errors}} = useForm<Inputs>();
    const [submitting, setSubmitting] = React.useState(false);
    const onSubmit: SubmitHandler<Inputs> = data => {
        setSubmitting(true)
        if (appData.login) {
            axios.post('/authserver/authenticate', {
                username: data.username,
                password: data.password
            })
                .then(response => {
                    let data = response.data
                    if (data && data.accessToken) {
                        enqueueSnackbar("Giriş Başarılı，accessToken:" + data.accessToken, {variant: 'success'});
                        setAppData({
                            ...appData,
                            accessToken: data.accessToken,
                            tokenValid: true,
                            loginTime: Date.now(),
                            profileName: data.selectedProfile?.name,
                            uuid: data.selectedProfile?.id
                        });
                    } else {
                        enqueueSnackbar(data && data.errorMessage ? "Giriş başarısız: " + data.errorMessage: "Giriş başarısız", {variant: 'error'});
                    }
                })
                .catch(e => {
                    const response = e.response;
                    if (response && response.status == 403) {
                        enqueueSnackbar('Giriş başarısız: ' + response.data.errorMessage, {variant: 'error'});
                    } else {
                        enqueueSnackbar('Ağ hatası:' + e.message, {variant: 'error'});
                    }
                })
                .finally(() => setSubmitting(false))
        } else {
            axios.post('/authserver/register', {
                username: data.username,
                password: data.password,
                profileName: data.profileName
            })
                .then(response => {
                    let data = response.data
                    if (data && data.id) {
                        enqueueSnackbar("Kayıt başarılı，uuid:" + data.id, {variant: 'success'});
                        setLogin(true)
                    } else {
                        enqueueSnackbar(data && data.errorMessage ? "Kayıt başarısız: " + data.errorMessage: "Kayıt başarısız", {variant: 'error'});
                    }
                })
                .catch(e => {
                    const response = e.response;
                    if (response && response.data) {
                        let errorMessage = response.data.errorMessage;
                        let message =  "Kayıt başarısız: " + errorMessage;
                        if (errorMessage === "profileName exist") {
                            message = "Kayıt başarısız: Bu isim kullanılmış";
                        } else if (errorMessage === "profileName duplicate") {
                            message = "Kayıt başarısız: Bu isim premium kullanıcılarla çakışıyor";
                        }
                        enqueueSnackbar(message, {variant: 'error'});
                    } else {
                        enqueueSnackbar('Ağ hatası:' + e.message, {variant: 'error'});
                    }
                })
                .finally(() => setSubmitting(false))
        }
    };

    const [showPassword, setShowPassword] = React.useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const setLogin = (login: boolean) => setAppData((oldData: AppState) => {
        return {
            ...oldData,
            login
        };
    });

    return (
        <Container maxWidth={'sm'}>
            <Paper className={'login-card'}>
                <section className="header">
                    <h1>Kayıt Ol / Giriş Yap</h1>
                </section>
                <Box component="form" autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                    <div className='username'>
                        <TextField
                            id="username-input"
                            name='username'
                            fullWidth
                            label="E-Posta"
                            variant="filled"
                            required
                            error={errors.username && true}
                            type='email'
                            inputProps={{
                                ...register('username', {required: true})
                            }}
                        />
                    </div>
                    <Collapse in={!appData.login} className='profileName'>
                        <FormControl fullWidth variant="filled" required={!appData.login} error={errors.profileName && true}>
                            <InputLabel htmlFor="profileName-input">Minecraft kullanıcı adı</InputLabel>
                            <FilledInput
                                id="profileName-input"
                                name="profileName"
                                required={!appData.login}
                                inputProps={appData.login ? {} : {
                                    minLength: '2', maxLength: 16,
                                    ...register('profileName', {required: true, minLength: 2, pattern: /^[a-zA-Z0-9_]{1,16}$/, maxLength: 16})
                                }}
                            />
                            <FocusedShowHelperText id="profileName-input-helper-text">harf, sayı veya alt çizgi</FocusedShowHelperText>
                        </FormControl>
                    </Collapse>
                    <div className='password'>
                        <FormControl fullWidth variant="filled" required error={errors.password && true}>
                            <InputLabel htmlFor="password-input">Şifre</InputLabel>
                            <FilledInput
                                id="password-input"
                                name="password"
                                required
                                type={showPassword ? 'text' : 'password'}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="şifreyi göster"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end">
                                            {showPassword ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                inputProps={{
                                    minLength: '6',
                                    ...register('password', {required: true, minLength: 6})
                                }}
                            />
                            <FocusedShowHelperText id="password-input-helper-text">Uyarı: Şifre Sıfırlama Yoktor Şifrenizi İyi Saklayınız</FocusedShowHelperText>
                        </FormControl>
                    </div>
                    <div className='button-container'>
                        <Button variant='contained' onClick={() => setLogin(!appData.login)} disabled={submitting}>{appData.login ? 'Kayıt Ol' : 'Zaten Bir Hesabın Varmı ?'}</Button>
                        <Button variant='contained' type='submit' disabled={submitting}>{appData.login ? 'Giriş Yap' : 'Kayıt Ol'}</Button>
                    </div>
                </Box>
            </Paper>
        </Container>
    );
}

export default Login;