package org.abhinavgpt.fanficdndbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;

@TestConfiguration(proxyBeanMethods = false)
public class TestFanficdndbackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(FanficdndbackendApplication::main).with(TestFanficdndbackendApplication.class).run(args);
	}

}
